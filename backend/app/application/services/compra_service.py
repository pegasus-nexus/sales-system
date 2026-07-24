import math
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from decimal import Decimal

from app.domain.models.compra import PurchaseOrder, PurchaseReception, PurchaseOrderStatus
from app.domain.models.inventario import Inventario, InventoryLog, TipoMovimiento
from app.domain.models.product import Product
from app.domain.models.base import DecimalMoney
from app.infrastructure.db import get_client
from app.infrastructure.repositories.compra import PurchaseOrderRepository, PurchaseReceptionRepository

class CompraService:
    def __init__(self):
        self.purchase_orders = PurchaseOrderRepository()
        self.purchase_receptions = PurchaseReceptionRepository()

    @staticmethod
    def _recalculate_price(old_price: Decimal, old_cost: Decimal, new_cost: Decimal) -> Decimal:
        """
        Recalcula el precio de venta manteniendo la proporción de ganancia original (margen).
        Formula: (precio_anterior * nuevo_costo) / costo_anterior
        Luego aplica redondeo retail:
        - Si decimal <= 0.50 -> se redondea a .50
        - Si decimal > 0.50 -> se redondea al siguiente entero (.00)
        - Si no hay decimal -> se mantiene
        """
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
        order.updated_at = datetime.utcnow()
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
                        
                        order.updated_at = datetime.utcnow()
                        await self.purchase_orders.update(order, session=session)

                # 3. Procesar cada ítem recibido (Inventario, Kárdex, Precios)
                for item in reception.detalles:
                    almacen_id = "default"
                    
                    inventario = await Inventario.find_one(
                        Inventario.tenant_id == reception.tenant_id,
                        Inventario.sucursal_id == reception.sucursal_id,
                        Inventario.almacen_id == almacen_id,
                        Inventario.producto_id == item.producto_id,
                        session=session
                    )
                    
                    stock_previo = inventario.cantidad if inventario else 0.0
                    nuevo_stock = stock_previo + item.cantidad_recibida
                    
                    if inventario:
                        inventario.cantidad = nuevo_stock
                        inventario.updated_at = datetime.utcnow()
                        await inventario.save(session=session)
                    else:
                        inventario = Inventario(
                            tenant_id=reception.tenant_id,
                            sucursal_id=reception.sucursal_id,
                            almacen_id=almacen_id,
                            producto_id=item.producto_id,
                            cantidad=nuevo_stock
                        )
                        await inventario.insert(session=session)
                    
                    # --- Obtener Producto para Kárdex y Actualización de Precios ---
                    producto = await Product.find_one(
                        Product.id == ObjectId(item.producto_id),
                        Product.tenant_id == reception.tenant_id,
                        session=session
                    )
                    
                    if producto:
                        old_cost = producto.costo_producto.to_decimal()
                        new_cost = item.costo_unitario_real.to_decimal()
                        
                        # Para el precio de venta en este momento, usaremos el precio de la sucursal o el base.
                        precio_venta_momento = Decimal("0")
                        if producto.precios_sucursales and reception.sucursal_id in producto.precios_sucursales:
                            precio_venta_momento = producto.precios_sucursales[reception.sucursal_id].to_decimal()
                        else:
                            precio_venta_momento = producto.precio_venta.to_decimal()

                        log = InventoryLog(
                            tenant_id=reception.tenant_id,
                            sucursal_id=reception.sucursal_id,
                            almacen_id=almacen_id,
                            producto_id=item.producto_id,
                            descripcion=producto.descripcion,
                            tipo_movimiento=TipoMovimiento.COMPRA,
                            cantidad_movida=item.cantidad_recibida,
                            stock_resultante=nuevo_stock,
                            costo_unitario_momento=DecimalMoney(str(new_cost)),
                            precio_venta_momento=DecimalMoney(str(precio_venta_momento)),
                            usuario_id=usuario_id,
                            usuario_nombre=usuario_nombre,
                            referencia_id=str(reception.id),
                            notas=f"Ingreso por compra. Doc: {reception.numero_documento}"
                        )
                        await log.insert(session=session)
                        
                        # --- Actualizar Costo y Precios si cambió ---
                        if new_cost != old_cost:
                            producto.costo_producto = DecimalMoney(str(new_cost))
                            
                            # Recalcular precio para esta sucursal específica
                            if producto.precios_sucursales is None:
                                producto.precios_sucursales = {}
                                
                            old_price = Decimal("0")
                            if reception.sucursal_id in producto.precios_sucursales:
                                old_price = producto.precios_sucursales[reception.sucursal_id].to_decimal()
                            else:
                                old_price = producto.precio_venta.to_decimal()
                                
                            # Recalcular aplicando redondeo
                            new_price = self._recalculate_price(old_price, old_cost, new_cost)
                            producto.precios_sucursales[reception.sucursal_id] = DecimalMoney(str(new_price))
                            
                            await producto.save(session=session)

                return reception

    async def list_purchase_orders(self, tenant_id: str, sucursal_id: str) -> List[PurchaseOrder]:
        return await self.purchase_orders.list_by_tenant(tenant_id, sucursal_id)

    async def get_purchase_order(self, tenant_id: str, sucursal_id: str, order_id: str) -> Optional[PurchaseOrder]:
        return await self.purchase_orders.get_by_id(tenant_id, sucursal_id, order_id)

    async def list_purchase_receptions(self, tenant_id: str, sucursal_id: str) -> List[PurchaseReception]:
        return await self.purchase_receptions.list_by_tenant(tenant_id, sucursal_id)

    async def get_purchase_reception(self, tenant_id: str, sucursal_id: str, reception_id: str) -> Optional[PurchaseReception]:
        return await self.purchase_receptions.get_by_id(tenant_id, sucursal_id, reception_id)
