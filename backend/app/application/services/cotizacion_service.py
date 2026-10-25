from typing import List, Optional
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import HTTPException
from app.domain.models.cotizacion import Cotizacion, CotizacionItem, CotizacionCliente, EstadoCotizacion
from app.domain.models.product import Product
from app.domain.models.user import User
from app.domain.models.base import DecimalMoney
from app.domain.models.sale import SaleCreate, SaleItemCreate, PagoItemCreate

class CotizacionService:

    @staticmethod
    async def generar_numero_cotizacion(tenant_id: str) -> str:
        coll = Cotizacion.get_motor_collection()
        count = await coll.count_documents({"tenant_id": tenant_id})
        return f"COT-{count + 1:04d}"

    @staticmethod
    async def crear_cotizacion(
        tenant_id: str,
        sucursal_id: str,
        almacen_id: str,
        cliente_data: dict,
        items_data: list,
        validez_dias: int,
        notas: Optional[str],
        condiciones_comerciales: Optional[str],
        current_user: User
    ) -> Cotizacion:
        if not items_data:
            raise HTTPException(status_code=400, detail="La cotización debe tener al menos un ítem.")

        numero = await CotizacionService.generar_numero_cotizacion(tenant_id)
        
        parsed_items: List[CotizacionItem] = []
        subtotal_acc = Decimal("0.0")
        
        for item in items_data:
            prod_id = item.get("producto_id")
            product = await Product.find_one(Product.id == prod_id, Product.tenant_id == tenant_id)
            if not product:
                # Intento con ObjectId si vino en formato string
                from beanie import PydanticObjectId
                try:
                    product = await Product.find_one(Product.id == PydanticObjectId(prod_id), Product.tenant_id == tenant_id)
                except Exception:
                    pass

            desc = product.descripcion if product else item.get("descripcion", "Producto")
            cod = product.codigo_corto if product else item.get("codigo_corto")
            
            cant = float(item.get("cantidad", 1))
            pu = Decimal(str(item.get("precio_unitario", 0)))
            desc_u = Decimal(str(item.get("descuento_unitario", 0)))
            
            sub = max(Decimal("0.0"), (pu - desc_u) * Decimal(str(cant)))
            subtotal_acc += sub
            
            parsed_items.append(CotizacionItem(
                producto_id=str(prod_id),
                descripcion=desc,
                codigo_corto=cod,
                cantidad=cant,
                precio_unitario=DecimalMoney(str(pu)),
                descuento_unitario=DecimalMoney(str(desc_u)),
                subtotal=DecimalMoney(str(sub))
            ))

        cliente = CotizacionCliente(**cliente_data)
        
        cotizacion = Cotizacion(
            tenant_id=tenant_id,
            sucursal_id=sucursal_id,
            almacen_id=almacen_id,
            numero_cotizacion=numero,
            cliente=cliente,
            items=parsed_items,
            subtotal=DecimalMoney(str(subtotal_acc)),
            descuento_global=DecimalMoney("0.0"),
            total=DecimalMoney(str(subtotal_acc)),
            validez_dias=validez_dias or 15,
            estado=EstadoCotizacion.BORRADOR,
            notas=notas,
            condiciones_comerciales=condiciones_comerciales or "Precios válidos según fecha estipulada.",
            vendedor_id=str(current_user.id),
            vendedor_nombre=current_user.full_name or current_user.username
        )
        await cotizacion.insert()
        return cotizacion

    @staticmethod
    async def cambiar_estado(
        cotizacion_id: str,
        nuevo_estado: EstadoCotizacion,
        tenant_id: str
    ) -> Cotizacion:
        from beanie import PydanticObjectId
        cot = await Cotizacion.find_one(Cotizacion.id == PydanticObjectId(cotizacion_id), Cotizacion.tenant_id == tenant_id)
        if not cot:
            raise HTTPException(status_code=404, detail="Cotización no encontrada")

        cot.estado = nuevo_estado
        cot.updated_at = datetime.now(timezone.utc)
        await cot.save()
        return cot

    @staticmethod
    async def convertir_en_venta(
        cotizacion_id: str,
        metodo_pago: str,
        tenant_id: str,
        current_user: User
    ) -> dict:
        """
        Pasa la cotización a estado FACTURADA y descuenta stock automáticamente
        ejecutando una venta real transaccional a través de SalesService.
        """
        from beanie import PydanticObjectId
        from app.application.services.sales_service import SalesService
        from app.domain.models.sale import ClienteInfo

        cot = await Cotizacion.find_one(Cotizacion.id == PydanticObjectId(cotizacion_id), Cotizacion.tenant_id == tenant_id)
        if not cot:
            raise HTTPException(status_code=404, detail="Cotización no encontrada")
        
        if cot.estado == EstadoCotizacion.FACTURADA:
            raise HTTPException(status_code=400, detail="Esta cotización ya fue facturada anteriormente.")

        # Construir el payload de venta
        sale_items = []
        for it in cot.items:
            sale_items.append(SaleItemCreate(
                producto_id=it.producto_id,
                cantidad=it.cantidad,
                precio_unitario=Decimal(str(it.precio_unitario)),
                descuento_unitario=Decimal(str(it.descuento_unitario)),
                almacen_id=cot.almacen_id
            ))

        total_venta = Decimal(str(cot.total))
        pagos = [PagoItemCreate(metodo=metodo_pago, monto=total_venta)]

        cliente_info = ClienteInfo(
            razon_social=cot.cliente.nombre_razon_social,
            nit=cot.cliente.nit_ci,
            telefono=cot.cliente.telefono,
            email=cot.cliente.email,
            es_factura=True if cot.cliente.nit_ci else False
        )

        sale_in = SaleCreate(
            sucursal_id=cot.sucursal_id,
            almacen_id=cot.almacen_id,
            items=sale_items,
            pagos=pagos,
            cliente_id=cot.cliente.cliente_id,
            cliente=cliente_info,
            vendedor_id=str(current_user.id),
            vendedor_name=current_user.full_name or current_user.username
        )

        sale = await SalesService.create_sale(sale_in=sale_in, current_user=current_user)

        # Marcar la cotización como facturada y ligar al sale_id
        cot.estado = EstadoCotizacion.FACTURADA
        cot.sale_id = str(sale.id)
        cot.updated_at = datetime.now(timezone.utc)
        await cot.save()

        return {
            "message": "Cotización convertida en venta y facturada exitosamente",
            "sale_id": str(sale.id),
            "cotizacion_id": str(cot.id),
            "numero_cotizacion": cot.numero_cotizacion
        }
