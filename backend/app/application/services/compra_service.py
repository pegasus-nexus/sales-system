import math
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timezone
from decimal import Decimal

from app.domain.models.compra import PurchaseOrder, PurchaseReception, PurchaseOrderStatus
from app.domain.models.inventario import Inventario, InventoryLog, TipoMovimiento
from app.domain.models.product import Product
from app.domain.models.base import DecimalMoney
from app.infrastructure.db import get_client
from app.domain.models.caja import CajaSesion, CajaMovimiento, EstadoSesion, SubtipoMovimiento
from app.domain.models.cuenta_por_pagar import CuentaPorPagar, MetodoPagoCompra
from app.infrastructure.repositories.compra import PurchaseOrderRepository, PurchaseReceptionRepository

def _to_decimal(val) -> Decimal:
    if val is None:
        return Decimal("0.0")
    if isinstance(val, Decimal):
        return val
    if hasattr(val, "to_decimal"):
        try:
            return val.to_decimal()
        except Exception:
            pass
    try:
        return Decimal(str(val))
    except Exception:
        return Decimal("0.0")


class CompraService:
    def __init__(self):
        self.purchase_orders = PurchaseOrderRepository()
        self.purchase_receptions = PurchaseReceptionRepository()

    @staticmethod
    def _recalculate_price(old_price: Decimal, old_cost: Decimal, new_cost: Decimal) -> Decimal:
        if old_cost <= Decimal("0"):
            return old_price
        
        exact_new_price = (old_price * new_cost) / old_cost
        
        integer_part = math.floor(exact_new_price)
        fractional_part = exact_new_price - Decimal(integer_part)
        
        if fractional_part == Decimal("0"):
            return Decimal(integer_part)
        elif fractional_part <= Decimal("0.50"):
            return Decimal(integer_part) + Decimal("0.50")
        else:
            return Decimal(integer_part) + Decimal("1.00")

    async def create_purchase_order(self, order: PurchaseOrder) -> PurchaseOrder:
        order.estado = PurchaseOrderStatus.BORRADOR
        return await self.purchase_orders.create(order)

    async def update_purchase_order_status(self, tenant_id: str, sucursal_id: str, order_id: str, status: PurchaseOrderStatus) -> PurchaseOrder:
        order = await self.purchase_orders.get_by_id(tenant_id, sucursal_id, order_id)
        if not order:
            raise ValueError("Purchase order not found")
        order.estado = status
        order.updated_at = datetime.now(timezone.utc)
        return await self.purchase_orders.update(order)

    async def confirm_purchase_reception(
        self,
        reception: PurchaseReception,
        usuario_id: str,
        usuario_nombre: str
    ) -> PurchaseReception:
        """
        Registra la recepción física de la mercadería, actualiza stock (Inventario),
        crea el historial (InventoryLog), actualiza la Orden de Compra si corresponde,
        y actualiza los costos/precios de los productos si hubo variaciones.
        Se ejecuta de forma atómica.
        """
        client = get_client()
        async with await client.start_session() as session:
            async with session.start_transaction():
                # 1. Crear el documento de Recepción
                reception.creado_por = usuario_id
                reception = await self.purchase_receptions.create(reception, session=session)

                # 2. Si viene de una Orden de Compra, actualizar la Orden
                if reception.purchase_order_id:
                    order = await self.purchase_orders.get_by_id(
                        reception.tenant_id, reception.sucursal_id, reception.purchase_order_id, session=session
                    )
                    if order:
                        for r_item in reception.detalles:
                            for o_item in order.detalles:
                                if o_item.producto_id == r_item.producto_id:
                                    o_item.cantidad_recibida += r_item.cantidad_recibida
                        
                        # Chequear si se completó o quedó parcial
                        all_completed = all(item.cantidad_recibida >= item.cantidad_pedida for item in order.detalles)
                        some_received = any(item.cantidad_recibida > 0 for item in order.detalles)
                        
                        if all_completed:
                            order.estado = PurchaseOrderStatus.COMPLETADO
                        elif some_received:
                            order.estado = PurchaseOrderStatus.PARCIAL
                        
                        order.updated_at = datetime.now(timezone.utc)
                        await self.purchase_orders.update(order, session=session)

                # 3. Procesar cada ítem recibido (Inventario, Kárdex, Precios)
                for item in reception.detalles:
                    # Fix Bug 2: Resolver almacen_id real de la sucursal
                    from app.domain.models.almacen import Almacen
                    almacen_default = await Almacen.find_one(
                        Almacen.tenant_id == reception.tenant_id,
                        Almacen.sucursal_id == reception.sucursal_id,
                        Almacen.is_default == True,
                        session=session
                    )
                    almacen_id = str(almacen_default.id) if almacen_default else "default"
                    
                    # Buscar inventario existente (compatibilidad con "default" legacy)
                    inv_query = {
                        "tenant_id": reception.tenant_id,
                        "sucursal_id": reception.sucursal_id,
                        "producto_id": item.producto_id,
                    }
                    if almacen_id == "default":
                        inv_query["$or"] = [{"almacen_id": "default"}, {"almacen_id": {"$exists": False}}, {"almacen_id": None}]
                    else:
                        inv_query["$or"] = [{"almacen_id": almacen_id}, {"almacen_id": "default"}, {"almacen_id": {"$exists": False}}, {"almacen_id": None}]

                    from pymongo import ReturnDocument
                    
                    # Usar find_one_and_update para operacion atomica
                    inventario_pre = await Inventario.find_one(inv_query, session=session)
                    stock_previo = inventario_pre.cantidad if inventario_pre else 0.0
                    
                    if not reception.es_historico:
                        # Incremento atomico
                        update_op = {
                            "$inc": {"cantidad": item.cantidad_recibida},
                            "$set": {"updated_at": datetime.now(timezone.utc)},
                            "$setOnInsert": {
                                "tenant_id": reception.tenant_id,
                                "sucursal_id": reception.sucursal_id,
                                "almacen_id": almacen_id,
                                "producto_id": item.producto_id,
                                "created_at": datetime.now(timezone.utc)
                            }
                        }
                        raw_inv = await Inventario.get_pymongo_collection().find_one_and_update(
                            inv_query,
                            update_op,
                            upsert=True,
                            return_document=ReturnDocument.AFTER,
                            session=session.client_session if hasattr(session, "client_session") else session
                        )
                        nuevo_stock = raw_inv["cantidad"]
                        almacen_final = raw_inv.get("almacen_id", almacen_id)
                    else:
                        # Es historico: no incrementamos stock real
                        nuevo_stock = stock_previo
                        almacen_final = inventario_pre.almacen_id if inventario_pre else almacen_id
                    
                    # --- Obtener Producto para Kárdex y Actualización de Precios ---
                    producto = None
                    try:
                        from beanie import PydanticObjectId
                        producto = await Product.find_one(
                            Product.id == PydanticObjectId(item.producto_id),
                            Product.tenant_id == reception.tenant_id,
                            session=session
                        )
                    except Exception:
                        pass
                    
                    if not producto:
                        producto = await Product.find_one(
                            Product.codigo_corto == item.producto_id,
                            Product.tenant_id == reception.tenant_id,
                            session=session
                        )
                    
                    # Fix Bug 3: SIEMPRE crear InventoryLog, incluso sin producto
                    new_cost = _to_decimal(item.costo_unitario_real)
                    precio_venta_momento = Decimal("0")
                    descripcion_log = getattr(item, "nombre_producto", None) or getattr(item, "codigo_producto", None) or item.producto_id
                    producto_id_log = item.producto_id

                    if producto:
                        old_cost = _to_decimal(producto.costo_producto)
                        descripcion_log = producto.descripcion
                        producto_id_log = str(producto.id)
                        
                        if producto.precios_sucursales and reception.sucursal_id in producto.precios_sucursales:
                            precio_venta_momento = _to_decimal(producto.precios_sucursales[reception.sucursal_id])
                        else:
                            precio_venta_momento = _to_decimal(producto.precio_venta)

                    log = InventoryLog(
                        tenant_id=reception.tenant_id,
                        sucursal_id=reception.sucursal_id,
                        almacen_id=almacen_final,
                        producto_id=producto_id_log,
                        descripcion=descripcion_log,
                        tipo_movimiento=TipoMovimiento.COMPRA,
                        cantidad_movida=item.cantidad_recibida,
                        stock_resultante=nuevo_stock,
                        costo_unitario_momento=DecimalMoney(str(new_cost)),
                        precio_venta_momento=DecimalMoney(str(precio_venta_momento)),
                        usuario_id=usuario_id,
                        usuario_nombre=usuario_nombre,
                        referencia_id=str(reception.id),
                        notas=f"Ingreso por compra. Doc: {reception.numero_documento}",
                        created_at=reception.created_at
                    )
                    await log.insert(session=session)
                    
                    # --- Actualizar Costo y Precios si cambió ---
                    if producto and new_cost != old_cost:
                        producto.costo_producto = DecimalMoney(str(new_cost))
                        
                        # Recalcular precio para esta sucursal específica
                        if producto.precios_sucursales is None:
                            producto.precios_sucursales = {}
                            
                        old_price = Decimal("0")
                        if reception.sucursal_id in producto.precios_sucursales:
                            old_price = _to_decimal(producto.precios_sucursales[reception.sucursal_id])
                        else:
                            old_price = _to_decimal(producto.precio_venta)
                            
                        # Recalcular aplicando redondeo
                        new_price = self._recalculate_price(old_price, old_cost, new_cost)
                        producto.precios_sucursales[reception.sucursal_id] = DecimalMoney(str(new_price))
                        
                        await producto.save(session=session)

                # 4. Impacto Financiero
                if reception.metodo_pago in ["CREDITO", "CONSIGNACION"]:
                    # Crear Cuenta por Pagar
                    cuenta = CuentaPorPagar(
                        tenant_id=reception.tenant_id,
                        sucursal_id=reception.sucursal_id,
                        proveedor_id=reception.proveedor_id,
                        proveedor_nombre=reception.proveedor_nombre,
                        purchase_reception_id=str(reception.id),
                        numero_documento=reception.numero_documento,
                        monto_total=reception.total_real,
                        saldo_pendiente=reception.total_real,
                        fecha_vencimiento=reception.fecha_vencimiento_credito,
                        notas=f"Generado automáticamente por ingreso {reception.numero_documento} ({reception.metodo_pago})"
                    )
                    await cuenta.insert(session=session)
                    reception.estado_pago = "PENDIENTE"
                else:
                    # Descontar de la caja si es pago al contado
                    sesion_abierta = await CajaSesion.find_one(
                        CajaSesion.tenant_id == reception.tenant_id,
                        CajaSesion.sucursal_id == reception.sucursal_id,
                        CajaSesion.estado == EstadoSesion.ABIERTA,
                        session=session
                    )
                    if sesion_abierta:
                        movimiento = CajaMovimiento(
                            tenant_id=reception.tenant_id,
                            sucursal_id=reception.sucursal_id,
                            sesion_id=str(sesion_abierta.id),
                            cajero_id=usuario_id,
                            cajero_name=usuario_nombre,
                            subtipo=SubtipoMovimiento.EGRESO_COMPRA,
                            tipo="EGRESO",
                            monto=reception.total_real,
                            descripcion=f"Pago por ingreso de mercadería a proveedor: {reception.proveedor_nombre}"
                        )
                        await movimiento.insert(session=session)
                    reception.estado_pago = "PAGADO"
                
                await reception.save(session=session)
                return reception

    async def list_purchase_orders(self, tenant_id: str, sucursal_id: str) -> List[PurchaseOrder]:
        return await self.purchase_orders.list_by_tenant(tenant_id, sucursal_id)

    async def get_purchase_order(self, tenant_id: str, sucursal_id: str, order_id: str) -> Optional[PurchaseOrder]:
        return await self.purchase_orders.get_by_id(tenant_id, sucursal_id, order_id)

    async def list_purchase_receptions(self, tenant_id: str, sucursal_id: str) -> List[PurchaseReception]:
        return await self.purchase_receptions.list_by_tenant(tenant_id, sucursal_id)

    async def get_purchase_reception(self, tenant_id: str, sucursal_id: str, reception_id: str) -> Optional[PurchaseReception]:
        return await self.purchase_receptions.get_by_id(tenant_id, sucursal_id, reception_id)
