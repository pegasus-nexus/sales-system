import math
from typing import Any

from bson import ObjectId
from fastapi import HTTPException

from app.domain.models.category import Category
from app.domain.models.inventario import Inventario
from app.domain.models.product import Product
from app.domain.models.sucursal import Sucursal
from app.domain.models.user import User, UserRole
from app.domain.schemas.product import ProductCreate, ProductUpdate


async def _enrich(product: Product) -> Product:
    if product.categoria_id:
        cat = await Category.get(product.categoria_id)
        if cat:
            product.categoria_nombre = cat.name
    return product

async def _can_user_edit_prices(current_user: User) -> bool:
    if current_user.role in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]:
        return True
    if current_user.role == UserRole.ADMIN_SUCURSAL:
        u_identifier = ((current_user.username or "") + " " + (current_user.full_name or "")).lower()
        if any(h in u_identifier for h in ["heroina", "heroína", "heroinas", "heroínas", "hero"]):
            return True
        if current_user.sucursal_id:
            from beanie import PydanticObjectId

            from app.domain.models.sucursal import Sucursal
            try:
                suc = await Sucursal.get(PydanticObjectId(current_user.sucursal_id)) if PydanticObjectId.is_valid(current_user.sucursal_id) else None
                if not suc:
                    suc = await Sucursal.find_one(Sucursal.id == current_user.sucursal_id)
                if suc and any(h in (suc.nombre or "").lower() for h in ["heroina", "heroína", "heroinas", "heroínas", "hero"]):
                    return True
            except Exception:
                pass
    return False

class ProductService:
    @staticmethod
    async def get_products_list(
        current_user: User,
        page: int = 1,
        limit: int = 50,
        search: str | None = None,
        category_id: str | None = None,
        active_only: bool = True
    ) -> dict[str, Any]:
        tenant_id = current_user.tenant_id or "default"
        skip = (page - 1) * limit if limit > 0 else 0

        query = Product.find(Product.tenant_id == tenant_id)
        if active_only and current_user.role != UserRole.SUPERADMIN:
            query = query.find(Product.is_active == True)

        if search:
            query = query.find({
                "$or": [
                    {"descripcion": {"$regex": search, "$options": "i"}},
                    {"codigo_largo": {"$regex": search, "$options": "i"}},
                    {"codigo_corto": {"$regex": search, "$options": "i"}}
                ]
            })
        else:
            query = query.find({"is_variant": {"$ne": True}})

        if category_id:
            query = query.find(Product.categoria_id == category_id)

        total = await query.count()
        products = await query.skip(skip).limit(limit).to_list()
        p_ids = [str(p.id) for p in products]

        from beanie.operators import In

        can_edit_prices = await _can_user_edit_prices(current_user)
        if not can_edit_prices:
            if current_user.sucursal_id:
                invs_cursor = Inventario.get_motor_collection().find({
                    "producto_id": {"$in": p_ids},
                    "sucursal_id": current_user.sucursal_id
                }, {"producto_id": 1, "precio_sucursal": 1})
                invs = await invs_cursor.to_list(length=None)
            else:
                invs = []

            price_map = {}
            for i in invs:
                precio = i.get("precio_sucursal")
                if precio is not None and float(str(precio)) > 0:
                    price_map[str(i["producto_id"])] = float(str(precio))

            for p in products:
                if str(p.id) in price_map:
                    p.precio_venta = price_map[str(p.id)]
                p.precios_sucursales = {}
                p.costo_producto = 0.0
        else:
            # OPTIMIZACIÓN: Evitar crear miles de modelos Pydantic usando motor crudo
            invs_cursor = Inventario.get_motor_collection().find({
                "producto_id": {"$in": p_ids}
            }, {"producto_id": 1, "sucursal_id": 1, "precio_sucursal": 1})
            invs = await invs_cursor.to_list(length=None)

            p_map = {str(p.id): {} for p in products}
            for i in invs:
                precio = i.get("precio_sucursal")
                if precio is not None:
                    p_map[str(i["producto_id"])][str(i["sucursal_id"])] = float(str(precio))
            for p in products:
                p.precios_sucursales = p_map.get(str(p.id), {})

        cat_ids = list(set([p.categoria_id for p in products if p.categoria_id]))
        if cat_ids:
            obj_ids = [ObjectId(cid) for cid in cat_ids if ObjectId.is_valid(cid)]
            cats = await Category.find(In(Category.id, obj_ids)).to_list() if obj_ids else []
            cat_map = {str(c.id): c.name for c in cats}
            for p in products:
                if p.categoria_id and str(p.categoria_id) in cat_map:
                    p.categoria_nombre = cat_map[str(p.categoria_id)]

        return {
            "items": products,
            "total": total,
            "page": page,
            "pages": math.ceil(total / limit) if limit > 0 else 1
        }

    @staticmethod
    async def create_product(data: ProductCreate, current_user: User) -> Product:
        if current_user.role in [UserRole.ADMIN_SUCURSAL] and current_user.sucursal_id:
            data.sucursales_permitidas = [current_user.sucursal_id]
        elif current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(status_code=403, detail="Rol no autorizado para crear productos")

        tenant_id = current_user.tenant_id or "default"

        # Free trial product limit validation (max 100)
        from app.domain.models.tenant import PlanType, Tenant
        tenant = await Tenant.get(tenant_id)
        if tenant and tenant.plan == PlanType.BASICO:
            product_count = await Product.find({"tenant_id": tenant_id, "is_active": True}).count()
            if product_count >= 100:
                raise HTTPException(status_code=403, detail="El plan gratuito permite un máximo de 100 productos. Actualiza tu plan para crear más.")

        # Validate category belongs to tenant
        cat = await Category.get(data.categoria_id)
        if not cat or (current_user.role != UserRole.SUPERADMIN and cat.tenant_id != tenant_id):
            raise HTTPException(status_code=400, detail="Categoría no encontrada o no pertenece a tu empresa")

        # Validate codigo_corto uniqueness within tenant
        if data.codigo_corto:
            existing = await Product.find_one(
                Product.tenant_id == tenant_id,
                Product.codigo_corto == data.codigo_corto,
                Product.is_active == True
            )
            if existing:
                raise HTTPException(status_code=400, detail=f"El código corto '{data.codigo_corto}' ya existe en tu catálogo")

        # Validate descripcion uniqueness within tenant (case-insensitive) for primary products
        if data.descripcion and not data.is_variant:
            existing_name = await Product.find_one(
                Product.tenant_id == tenant_id,
                Product.is_active == True,
                Product.is_variant == False,
                {"descripcion": {"$regex": f"^{data.descripcion.strip()}$", "$options": "i"}}
            )
            if existing_name:
                raise HTTPException(status_code=400, detail=f"El producto con nombre '{data.descripcion}' ya existe en tu catálogo")

        variantes_payload = data.variantes_payload or []
        create_payload = data.model_dump(exclude={"precios_sucursales", "variantes_payload"})

        product = Product(
            tenant_id=tenant_id,
            **create_payload,
        )
        await product.create()

        # Si tiene variantes, crearlas de forma atómica y enlazada
        if data.has_variants and variantes_payload:
            created_variantes = []
            for v_idx, v in enumerate(variantes_payload):
                v_desc = v.get("descripcion") or f"{product.descripcion} ({', '.join(v.get('atributos', {}).values())})"
                v_sku = v.get("codigo_corto") or f"{product.codigo_corto or 'SKU'}-{v_idx+1}"
                v_barcode = v.get("codigo_largo")
                v_precio = float(v.get("precio_venta", product.precio_venta))
                v_costo = float(v.get("costo_producto", product.costo_producto))
                v_atributos = v.get("atributos", {})

                child = Product(
                    tenant_id=tenant_id,
                    parent_id=str(product.id),
                    is_variant=True,
                    has_variants=False,
                    descripcion=v_desc,
                    categoria_id=product.categoria_id,
                    codigo_corto=v_sku,
                    codigo_largo=v_barcode,
                    costo_producto=v_costo,
                    precio_venta=v_precio,
                    atributos=v_atributos,
                    image_url=v.get("image_url") or product.image_url,
                    tipo_item=product.tipo_item,
                    show_on_web=product.show_on_web,
                )
                await child.create()
                created_variantes.append({
                    "_id": str(child.id),
                    "id": str(child.id),
                    "descripcion": child.descripcion,
                    "codigo_corto": child.codigo_corto,
                    "codigo_largo": child.codigo_largo,
                    "precio_venta": float(child.precio_venta),
                    "costo_producto": float(child.costo_producto),
                    "atributos": child.atributos or {},
                })

            product.variantes_resumen = created_variantes
            await product.save()
        from app.infrastructure.core.audit import log_audit
        await log_audit(tenant_id, str(current_user.id), current_user.username, "CREATE_PRODUCT", "PRODUCT", str(product.id), {"codigo": product.codigo_corto})

        if data.precios_sucursales:
            from pymongo import UpdateOne
            ops = []
            for suc_id, precio in data.precios_sucursales.items():
                if precio is not None and precio >= 0:
                    ops.append(
                        UpdateOne(
                            {"tenant_id": tenant_id, "sucursal_id": suc_id, "producto_id": str(product.id)},
                            {
                                "$setOnInsert": {"cantidad": 0},
                                "$set": {"precio_sucursal": precio},
                                "$currentDate": {"updated_at": True}
                            },
                            upsert=True
                        )
                    )
            if ops:
                await Inventario.get_pymongo_collection().bulk_write(ops)

        product.precios_sucursales = data.precios_sucursales or {}
        return await _enrich(product)

    @staticmethod
    async def update_product(product_id: str, data: ProductUpdate, current_user: User) -> Product:
        # Role permission checks
        if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.ADMIN_SUCURSAL]:
            raise HTTPException(status_code=403, detail="Not authorized")

        can_edit_prices = await _can_user_edit_prices(current_user)
        if current_user.role == UserRole.ADMIN_SUCURSAL and not can_edit_prices:
            # Non-Heroínas ADMIN_SUCURSAL is restricted to updating product image_url and proveedores
            data = ProductUpdate(
                image_url=data.image_url,
                proveedores=data.proveedores,
                proveedor=data.proveedor
            )

        product = await Product.get(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Validate codigo_corto uniqueness
        if data.codigo_corto and data.codigo_corto != product.codigo_corto:
            existing = await Product.find_one(
                Product.tenant_id == product.tenant_id,
                Product.codigo_corto == data.codigo_corto,
                Product.is_active == True
            )
            if existing and str(existing.id) != str(product.id):
                raise HTTPException(status_code=400, detail=f"El código corto '{data.codigo_corto}' ya existe")

        # Validate descripcion uniqueness
        if data.descripcion and data.descripcion != product.descripcion:
            existing_name = await Product.find_one(
                Product.tenant_id == product.tenant_id,
                Product.is_active == True,
                {"descripcion": {"$regex": f"^{data.descripcion.strip()}$", "$options": "i"}}
            )
            if existing_name and str(existing_name.id) != str(product.id):
                raise HTTPException(status_code=400, detail=f"Un producto con nombre '{data.descripcion}' ya existe")
        if current_user.role != UserRole.SUPERADMIN and product.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=403, detail="Product not found")

        # Audit log
        from app.domain.models.audit import AuditLog
        from app.domain.models.cost_history import ProductCostHistory
        old = product.model_dump()
        updates = data.model_dump(exclude_none=True)
        changes = {k: {"old": old.get(k), "new": v} for k, v in updates.items() if old.get(k) != v}

        if changes:
            # P-02: Cost History Trigger
            if "costo_producto" in changes:
                from decimal import Decimal
                costo_ant = Decimal(str(old.get("costo_producto") or 0))
                costo_nue = Decimal(str(updates.get("costo_producto") or 0))

                await ProductCostHistory(
                    tenant_id=product.tenant_id,
                    producto_id=str(product.id),
                    descripcion=product.descripcion,
                    costo_anterior=costo_ant,
                    costo_nuevo=costo_nue,
                    diferencia=round(costo_nue - costo_ant, 4),
                    motivo=None, # Motivo from Request could be added in schema later
                    cambiado_por=str(current_user.id),
                    cambiado_por_nombre=current_user.full_name or current_user.username
                ).create()


            await AuditLog(
                tenant_id=current_user.tenant_id,
                user_id=str(current_user.id),
                username=current_user.username,
                action="UPDATE", entity="PRODUCT",
                entity_id=product_id, details=changes,
            ).create()

        for field, value in updates.items():
            if field == "precios_sucursales": continue
            setattr(product, field, value)
        await product.save()

        if "precios_sucursales" in updates and updates["precios_sucursales"] is not None:
            from pymongo import UpdateOne
            precios = updates["precios_sucursales"]
            ops = []
            for suc_id, precio in precios.items():
                if precio is not None and precio >= 0:
                    ops.append(
                        UpdateOne(
                            {"tenant_id": product.tenant_id, "sucursal_id": suc_id, "producto_id": str(product.id)},
                            {
                                "$setOnInsert": {"cantidad": 0},
                                "$set": {"precio_sucursal": precio},
                                "$currentDate": {"updated_at": True}
                            },
                            upsert=True
                        )
                    )
            if ops:
                await Inventario.get_pymongo_collection().bulk_write(ops)
            product.precios_sucursales = precios
        else:
            # Load them to return properly to admin
            invs = await Inventario.find(Inventario.producto_id == str(product.id)).to_list()
            product.precios_sucursales = {i.sucursal_id: i.precio_sucursal for i in invs if i.precio_sucursal is not None}

        return await _enrich(product)

    @staticmethod
    async def deactivate_product(product_id: str, current_user: User):
        if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(status_code=403, detail="Solo administradores de matriz pueden desactivar productos")
        product = await Product.get(product_id)
        if not product or (current_user.role != UserRole.SUPERADMIN and product.tenant_id != current_user.tenant_id):
            raise HTTPException(status_code=404, detail="Product not found")
        product.is_active = False
        await product.save()
        from app.infrastructure.core.audit import log_audit
        await log_audit(product.tenant_id or "default", str(current_user.id), current_user.username, "DEACTIVATE_PRODUCT", "PRODUCT", str(product.id), {})
        return {"message": "Product deactivated"}

    @staticmethod
    async def get_product_detail(product_id: str, current_user: User) -> dict[str, Any]:
        """Obtiene la ficha técnica y desglose de existencias por sucursal de un producto."""
        tenant_id = current_user.tenant_id or "default"
        product = await Product.get(product_id)
        if not product or (current_user.role != UserRole.SUPERADMIN and product.tenant_id != tenant_id):
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        await _enrich(product)

        # Consultar existencias de este producto en todas las sucursales
        inv_docs = await Inventario.find(
            Inventario.producto_id == str(product.id),
            Inventario.tenant_id == tenant_id
        ).to_list()

        sucursales = await Sucursal.find(Sucursal.tenant_id == tenant_id).to_list()
        suc_map = {str(s.id): s.nombre for s in sucursales}
        suc_map["CENTRAL"] = "Casa Matriz / Central"

        stock_desglose = []
        stock_total = 0.0
        for inv in inv_docs:
            suc_nombre = suc_map.get(inv.sucursal_id, inv.sucursal_id)
            stock_desglose.append({
                "sucursal_id": inv.sucursal_id,
                "sucursal_nombre": suc_nombre,
                "almacen_id": inv.almacen_id,
                "cantidad": float(inv.cantidad),
                "precio_sucursal": float(inv.precio_sucursal) if inv.precio_sucursal is not None else None,
                "updated_at": inv.updated_at.isoformat() if inv.updated_at else None,
            })
            stock_total += float(inv.cantidad)

        is_admin = current_user.role in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]

        return {
            "id": str(product.id),
            "descripcion": product.descripcion,
            "codigo_sistema": product.codigo_sistema,
            "codigo_corto": product.codigo_corto,
            "codigo_largo": product.codigo_largo,
            "categoria_id": product.categoria_id,
            "categoria_nombre": product.categoria_nombre or "Sin Categoría",
            "precio_venta": float(product.precio_venta),
            "costo_producto": float(product.costo_producto) if is_admin else None,
            "tipo_item": str(product.tipo_item.value if hasattr(product.tipo_item, 'value') else product.tipo_item),
            "image_url": product.image_url,
            "is_active": product.is_active if hasattr(product, 'is_active') else True,
            "is_destacado": product.is_destacado,
            "show_on_web": product.show_on_web,
            "created_at": product.created_at.isoformat() if product.created_at else None,
            "stock_total": stock_total,
            "stock_desglose": stock_desglose,
        }

