from typing import Dict, Any, Optional
from datetime import datetime, timezone
from decimal import Decimal
from app.domain.models.sale import Sale
from app.domain.models.caja import CajaMovimiento
from app.domain.models.inventario import Inventario
from app.domain.models.product import Product
from app.domain.models.cuenta_por_pagar import CuentaPorPagar
from app.domain.models.credito import Deuda, TransaccionCredito
from app.domain.models.compra import PurchaseReception

class ContabilidadReportesService:
    @staticmethod
    async def get_estado_resultados(
        tenant_id: str, 
        fecha_inicio: datetime, 
        fecha_fin: datetime, 
        sucursal_id: Optional[str] = None
    ) -> Dict[str, Any]:
        # Ventas
        query_sales = {
            "tenant_id": tenant_id,
            "created_at": {"$gte": fecha_inicio, "$lte": fecha_fin},
            "is_active": True
        }
        if sucursal_id:
            query_sales["sucursal_id"] = sucursal_id
            
        ventas = await Sale.find(query_sales).to_list()
        ventas_brutas = sum((Decimal(str(v.total)) for v in ventas if not v.anulada), Decimal("0"))
        anulaciones = sum((Decimal(str(v.total)) for v in ventas if v.anulada), Decimal("0"))
        descuentos = Decimal("0") # Not provided in schema directly
        ventas_netas = ventas_brutas - descuentos
        
        # Costo de Ventas calculando iterativamente
        costo_ventas = Decimal("0")
        for v in ventas:
            if not v.anulada:
                for item in v.items:
                    costo_ventas += Decimal(str(item.costo_unitario)) * Decimal(str(item.cantidad))
        
        utilidad_bruta = ventas_netas - costo_ventas
        
        # Gastos
        query_gastos = {
            "tenant_id": tenant_id,
            "fecha": {"$gte": fecha_inicio, "$lte": fecha_fin},
            "tipo": "EGRESO",
            "is_active": True
        }
        gastos = await CajaMovimiento.find(query_gastos).to_list()
        gastos_operativos = sum((Decimal(str(g.monto)) for g in gastos), Decimal("0"))
        
        utilidad_operativa = utilidad_bruta - gastos_operativos
        utilidad_neta = utilidad_operativa
        
        return {
            "ventas_brutas": float(ventas_brutas),
            "descuentos": float(descuentos),
            "anulaciones": float(anulaciones),
            "ventas_netas": float(ventas_netas),
            "costo_ventas": float(costo_ventas),
            "utilidad_bruta": float(utilidad_bruta),
            "gastos_operativos": float(gastos_operativos),
            "utilidad_operativa": float(utilidad_operativa),
            "utilidad_neta": float(utilidad_neta)
        }

    @staticmethod
    async def get_balance_general(
        tenant_id: str, 
        fecha_corte: datetime, 
        sucursal_id: Optional[str] = None
    ) -> Dict[str, Any]:
        # Inventario
        inventarios = await Inventario.find({"tenant_id": tenant_id, "is_active": True}).to_list()
        valor_inventario = Decimal("0")
        for inv in inventarios:
            prod = await Product.find_one({"_id": inv.producto_id, "tenant_id": tenant_id})
            if prod:
                valor_inventario += Decimal(str(inv.cantidad)) * Decimal(str(prod.costo_producto))
                
        # Cuentas por Cobrar (Deudas)
        deudas = await Deuda.find({"tenant_id": tenant_id, "estado": {"$ne": "PAGADA"}, "is_active": True}).to_list()
        cuentas_cobrar = sum((Decimal(str(d.saldo_pendiente)) for d in deudas), Decimal("0"))
        
        # Efectivo (Saldo de Caja simple)
        movimientos = await CajaMovimiento.find({"tenant_id": tenant_id, "fecha": {"$lte": fecha_corte}, "is_active": True}).to_list()
        efectivo = sum((Decimal(str(m.monto)) if m.tipo == "INGRESO" else -Decimal(str(m.monto)) for m in movimientos), Decimal("0"))
        
        total_activos = valor_inventario + cuentas_cobrar + efectivo
        
        # Pasivos
        cuentas_pagar_docs = await CuentaPorPagar.find({"tenant_id": tenant_id, "estado": {"$ne": "PAGADA"}, "is_active": True}).to_list()
        cuentas_pagar = sum((Decimal(str(c.saldo_pendiente)) for c in cuentas_pagar_docs), Decimal("0"))
        
        total_pasivos = cuentas_pagar
        
        # Patrimonio
        capital = Decimal("0")
        resultados_acumulados = total_activos - total_pasivos - capital
        total_patrimonio = capital + resultados_acumulados
        
        return {
            "activos": {
                "efectivo": float(efectivo),
                "inventario": float(valor_inventario),
                "cuentas_cobrar": float(cuentas_cobrar),
                "total": float(total_activos)
            },
            "pasivos": {
                "cuentas_pagar": float(cuentas_pagar),
                "total": float(total_pasivos)
            },
            "patrimonio": {
                "capital": float(capital),
                "resultados_acumulados": float(resultados_acumulados),
                "total": float(total_patrimonio)
            }
        }

    @staticmethod
    async def get_flujo_efectivo(
        tenant_id: str, 
        fecha_inicio: datetime, 
        fecha_fin: datetime, 
        sucursal_id: Optional[str] = None
    ) -> Dict[str, Any]:
        # Cobros de Ventas al contado
        query_sales = {
            "tenant_id": tenant_id,
            "created_at": {"$gte": fecha_inicio, "$lte": fecha_fin},
            "is_active": True,
            "anulada": False
        }
        if sucursal_id:
            query_sales["sucursal_id"] = sucursal_id
            
        ventas = await Sale.find(query_sales).to_list()
        cobros_ventas = sum((Decimal(str(v.total)) for v in ventas), Decimal("0"))
        
        # Cobros de Créditos
        creditos = await TransaccionCredito.find({
            "tenant_id": tenant_id, 
            "fecha": {"$gte": fecha_inicio, "$lte": fecha_fin},
            "tipo": "ABONO",
            "is_active": True
        }).to_list()
        cobros_creditos = sum((Decimal(str(c.monto)) for c in creditos), Decimal("0"))
        
        # Gastos Operativos
        query_gastos = {
            "tenant_id": tenant_id,
            "fecha": {"$gte": fecha_inicio, "$lte": fecha_fin},
            "tipo": "EGRESO",
            "is_active": True
        }
        gastos = await CajaMovimiento.find(query_gastos).to_list()
        gastos_operativos = sum((Decimal(str(g.monto)) for g in gastos), Decimal("0"))
        
        # Pagos a Proveedores
        compras = await PurchaseReception.find({
            "tenant_id": tenant_id,
            "fecha_recepcion": {"$gte": fecha_inicio, "$lte": fecha_fin},
            "estado_pago": "PAGADO",
            "is_active": True
        }).to_list()
        pagos_proveedores = sum((Decimal(str(c.total_real)) for c in compras if c.total_real), Decimal("0"))
        
        flujo_neto_operativo = cobros_ventas + cobros_creditos - gastos_operativos - pagos_proveedores
        
        total_inversion = Decimal("0")
        total_financiamiento = Decimal("0")
        
        variacion_neta = flujo_neto_operativo + total_inversion + total_financiamiento
        
        return {
            "operativas": {
                "cobros_ventas": float(cobros_ventas),
                "cobros_creditos": float(cobros_creditos),
                "pagos_proveedores": float(pagos_proveedores),
                "gastos_operativos": float(gastos_operativos),
                "flujo_neto": float(flujo_neto_operativo)
            },
            "inversion": {
                "total": float(total_inversion)
            },
            "financiamiento": {
                "total": float(total_financiamiento)
            },
            "variacion_neta": float(variacion_neta)
        }
