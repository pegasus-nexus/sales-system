import io
import math
import uuid
import pandas as pd
from typing import Optional, Dict, Any
from fastapi import HTTPException
from pymongo import UpdateOne
from bson import ObjectId

from app.domain.models.product import Product
from app.domain.models.category import Category
from app.domain.models.user import User, UserRole
from app.domain.models.sucursal import Sucursal
from app.domain.models.inventario import Inventario, InventoryLog, TipoMovimiento
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
    if current_user.role == UserRole.ADMIN_SUCURSAL and current_user.sucursal_id:
        from app.domain.models.sucursal import Sucursal
        from beanie import PydanticObjectId
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
        search: Optional[str] = None,
        category_id: Optional[str] = None,
        active_only: bool = True
    ) -> Dict[str, Any]:
        tenant_id = current_user.tenant_id or "default"
        skip = (page - 1) * limit if limit > 0 else 0
        
        query = Product.find(Product.tenant_id == tenant_id)
        if active_only and current_user.role != UserRole.SUPERADMIN:
            query = query.find(Product.is_active == True)
            
        if search:
            query = query.find({
                "$or": [
                    {"descripcion": {"$regex": search, "$options": "i"}},
                    {"codigo": {"$regex": search, "$options": "i"}},
                    {"codigo_corto": {"$regex": search, "$options": "i"}}
                ]
            })
            
        if category_id:
            query = query.find(Product.categoria_id == category_id)
            
        total = await query.count()
        products = await query.skip(skip).limit(limit).to_list()
        p_ids = [str(p.id) for p in products]
        
        from beanie.operators import In
        
        if current_user.role in [UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR, UserRole.VENDEDOR, UserRole.CAJERO, UserRole.USER] or current_user.sucursal_id:
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
        if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(status_code=403, detail="Solo administradores de matriz pueden crear nuevos productos")

        tenant_id = current_user.tenant_id or "default"
    
        # Validate category belongs to tenant
        cat = await Category.get(data.categoria_id)
        if not cat or (current_user.role != UserRole.SUPERADMIN and cat.tenant_id != tenant_id):
            raise HTTPException(status_code=400, detail="Categoría no encontrada o no pertenece a tu empresa")
    
        # Validate codigo_corto uniqueness within tenant
        if data.codigo_corto:
            existing = await Product.find_one(
                Product.tenant_id == tenant_id,
                Product.codigo_corto == data.codigo_corto,
            )
            if existing:
                raise HTTPException(status_code=400, detail=f"El código corto '{data.codigo_corto}' ya existe en tu catálogo")
    
        product = Product(
            tenant_id=tenant_id,
            **data.model_dump(exclude={"precios_sucursales"}),
        )
        await product.create()
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
    
