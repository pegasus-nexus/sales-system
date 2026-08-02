import asyncio
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional
from app.domain.models.sale import Sale
from app.domain.models.sale_item import SaleItem
from app.domain.models.caja import CajaMovimiento, SubtipoMovimiento
from app.domain.models.product import Product
from app.domain.models.category import Category
from app.domain.models.daily_summary import (
    DailySalesSummary,
    CategoriaVentaInfo,
    ProveedorVentaInfo,
    ProductoVentaInfo,
    HoraVentaInfo,
    ResumenVentasMetodo,
    ResumenAnulaciones
)
from app.utils.date_utils import get_day_range_bolivia, BOLIVIA_TZ
from app.domain.models.base import DecimalMoney

_ZERO = Decimal("0")

class ConsolidatedReportingService:
    @staticmethod
    async def generate_daily_snapshot(
        tenant_id: str, 
        sucursal_id: str, 
        fecha: str, 
        es_definitivo: bool = True,
        generado_por_id: Optional[str] = None
    ) -> DailySalesSummary:
        """
        Generates or regenerates a materialized view for a single day and branch.
        fecha format: YYYY-MM-DD
        es_definitivo: True si se llamó desde el Cierre de Caja, False si fue on-the-fly pre-cierre.
        """
        start_dt, end_dt = get_day_range_bolivia(fecha)

        # 1. Base Sales Data
        sales = await Sale.find(
            Sale.tenant_id == tenant_id,
            Sale.sucursal_id == sucursal_id,
            Sale.created_at >= start_dt,
            Sale.created_at <= end_dt
        ).to_list()

        ventas_por_metodo = {"EFECTIVO": _ZERO, "QR": _ZERO, "TARJETA": _ZERO, "TRANSFERENCIA": _ZERO}
        total_ventas = _ZERO
        total_descuentos = _ZERO
        total_creditos = _ZERO
        anuladas_count = 0
        anuladas_monto = _ZERO
        
        costo_total = _ZERO

        # For BI aggregations
        clientes_set = set()
        tickets_list = []
        horas_dict = {}
        transacciones_validas = 0
        
        # Cache products to resolve categories and providers quickly
        # Or better, just aggregate on the fly for simplicity
        
        for s in sales:
            if s.anulada:
                anuladas_count += 1
                anuladas_monto += Decimal(str(s.total))
                continue
                
            transacciones_validas += 1
            tickets_list.append(float(s.total))
            
            c_val = "GENERAL"
            if s.cliente:
                c_val = getattr(s.cliente, 'razon_social', None) or getattr(s.cliente, 'nit', None) or "GENERAL"
            clientes_set.add(c_val)
            
            if s.created_at:
                h_str = s.created_at.astimezone(BOLIVIA_TZ).strftime("%H:00")
            else:
                h_str = "00:00"
            horas_dict[h_str] = horas_dict.get(h_str, _ZERO) + Decimal(str(s.total))
                
            total_ventas += Decimal(str(s.total))
            total_descuentos += Decimal(str(s.get_total_descuento()))

            if s.estado_pago in ["PENDIENTE", "PARCIAL"]:
                pagado = sum((Decimal(str(p.monto)) for p in s.pagos), _ZERO)
                credito_otorgado = Decimal(str(s.total)) - pagado
                total_creditos += credito_otorgado
                
            for p in s.pagos:
                metodo = p.metodo.upper()
                ventas_por_metodo[metodo] = ventas_por_metodo.get(metodo, _ZERO) + Decimal(str(p.monto))
                
            # Item Level
            for item in s.items:
                cant = Decimal(str(item.cantidad))
                subtot = Decimal(str(item.subtotal))
                costo_u = Decimal(str(item.costo_unitario))
                costo_tot = costo_u * cant
                costo_total += costo_tot
                
        # 2. Caja Movements (Gastos, Cambio)
        movimientos = await CajaMovimiento.find(
            CajaMovimiento.tenant_id == tenant_id,
            CajaMovimiento.sucursal_id == sucursal_id,
            CajaMovimiento.fecha >= start_dt,
            CajaMovimiento.fecha <= end_dt
        ).to_list()

        total_gastos = _ZERO
        total_cambio = _ZERO
        
        for m in movimientos:
            if m.tipo == "EGRESO":
                if m.subtipo == SubtipoMovimiento.GASTO:
                    total_gastos += Decimal(str(m.monto))
                elif m.subtipo == SubtipoMovimiento.CAMBIO:
                    total_cambio += Decimal(str(m.monto))

        # Net Cash = Total Cash Paid - Change given
        net_efectivo = max(_ZERO, ventas_por_metodo.get("EFECTIVO", _ZERO) - total_cambio)
        ventas_por_metodo["EFECTIVO"] = net_efectivo
        
        balance_neto = max(_ZERO, net_efectivo - total_gastos)

        ganancia_matriz = (costo_total * Decimal("0.15"))
        ganancia_sucursal = total_ventas - costo_total - ganancia_matriz

        # 3. BI Aggregations (Categories & Providers) via PyMongo to leverage the database
        cat_prov_pipeline = [
            {
                "$match": {
                    "tenant_id": tenant_id,
                    "sucursal_id": sucursal_id,
                    "sale_date": {"$gte": start_dt, "$lte": end_dt}
                }
            },
            {
                "$lookup": {
                    "from": "sales",
                    "let": {"sid": "$sale_id"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": [{"$toString": "$_id"}, "$$sid"]}, "anulada": False}}
                    ],
                    "as": "sale_parent"
                }
            },
            {"$match": {"sale_parent": {"$ne": []}}},
            {
                "$lookup": {
                    "from": "products",
                    "let": {"pid": "$producto_id"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": [{"$toString": "$_id"}, "$$pid"]}}}
                    ],
                    "as": "product_info"
                }
            },
            {"$unwind": {"path": "$product_info", "preserveNullAndEmptyArrays": True}},
            {
                "$addFields": {
                    "prov_name": {"$ifNull": ["$product_info.proveedor_nombre", {"$ifNull": ["$product_info.proveedor", "Sin Proveedor"]}]},
                    "cat_name": {"$ifNull": ["$product_info.categoria_nombre", {"$ifNull": ["$product_info.categoria", "Sin Categoría"]}]},
                    "prod_name": {"$ifNull": ["$product_info.nombre", {"$ifNull": ["$descripcion", "Desconocido"]}]},
                    "c_tot": {"$multiply": ["$costo_unitario", "$cantidad"]}
                }
            },
            {
                "$facet": {
                    "by_category": [
                        {
                            "$group": {
                                "_id": "$cat_name",
                                "cantidad": {"$sum": "$cantidad"},
                                "total_ventas": {"$sum": "$subtotal"},
                                "costo_total": {"$sum": "$c_tot"}
                            }
                        }
                    ],
                    "by_provider": [
                        {
                            "$group": {
                                "_id": "$prov_name",
                                "cantidad": {"$sum": "$cantidad"},
                                "total_ventas": {"$sum": "$subtotal"},
                                "costo_total": {"$sum": "$c_tot"}
                            }
                        }
                    ],
                    "by_product": [
                        {
                            "$group": {
                                "_id": "$prod_name",
                                "cantidad": {"$sum": "$cantidad"},
                                "total_ventas": {"$sum": "$subtotal"}
                            }
                        },
                        {"$sort": {"total_ventas": -1}},
                        {"$limit": 50}
                    ]
                }
            }
        ]
        
        cursor = SaleItem.get_pymongo_collection().aggregate(cat_prov_pipeline)
        bi_res = await cursor.to_list(length=1)
        
        cat_info_list = []
        prov_info_list = []
        prod_info_list = []
        
        if bi_res:
            for c in bi_res[0].get("by_category", []):
                cat_info_list.append(CategoriaVentaInfo(
                    nombre=str(c["_id"]),
                    cantidad=float(c["cantidad"]),
                    total_ventas=DecimalMoney(str(c["total_ventas"])),
                    costo_total=DecimalMoney(str(c["costo_total"]))
                ))
            for p in bi_res[0].get("by_provider", []):
                prov_info_list.append(ProveedorVentaInfo(
                    nombre=str(p["_id"]),
                    cantidad=float(p["cantidad"]),
                    total_ventas=DecimalMoney(str(p["total_ventas"])),
                    costo_total=DecimalMoney(str(p["costo_total"]))
                ))
            for pr in bi_res[0].get("by_product", []):
                prod_info_list.append(ProductoVentaInfo(
                    nombre=str(pr["_id"]),
                    cantidad=float(pr["cantidad"]),
                    total_ventas=DecimalMoney(str(pr["total_ventas"]))
                ))

        horas_list = []
        for h, m in sorted(horas_dict.items()):
            horas_list.append(HoraVentaInfo(hora=h, total_ventas=DecimalMoney(str(m))))

        # 4. Upsert Snapshot
        summary = await DailySalesSummary.find_one(
            DailySalesSummary.tenant_id == tenant_id,
            DailySalesSummary.sucursal_id == sucursal_id,
            DailySalesSummary.fecha == fecha
        )
        
        if not summary:
            summary = DailySalesSummary(tenant_id=tenant_id, sucursal_id=sucursal_id, fecha=fecha)
            
        summary.total_bruto = DecimalMoney(str(total_ventas))
        summary.total_descuentos = DecimalMoney(str(total_descuentos))
        summary.total_cambio = DecimalMoney(str(total_cambio))
        summary.total_gastos = DecimalMoney(str(total_gastos))
        summary.balance_neto = DecimalMoney(str(balance_neto))
        
        summary.costo_total = DecimalMoney(str(costo_total))
        summary.ganancia_matriz = DecimalMoney(str(ganancia_matriz))
        summary.ganancia_sucursal = DecimalMoney(str(ganancia_sucursal))
        
        summary.por_metodo = ResumenVentasMetodo(
            efectivo=DecimalMoney(str(ventas_por_metodo.get("EFECTIVO", _ZERO))),
            qr=DecimalMoney(str(ventas_por_metodo.get("QR", _ZERO))),
            tarjeta=DecimalMoney(str(ventas_por_metodo.get("TARJETA", _ZERO))),
            transferencia=DecimalMoney(str(ventas_por_metodo.get("TRANSFERENCIA", _ZERO))),
            credito=DecimalMoney(str(total_creditos))
        )
        
        summary.anuladas = ResumenAnulaciones(
            cantidad=anuladas_count,
            monto=DecimalMoney(str(anuladas_monto))
        )
        
        summary.por_categoria = cat_info_list
        summary.por_proveedor = prov_info_list
        summary.top_productos = prod_info_list
        summary.por_hora = horas_list
        
        summary.cantidad_transacciones = transacciones_validas
        summary.cantidad_clientes = len(clientes_set)
        summary.tickets_list = tickets_list
        
        summary.es_definitivo = es_definitivo
        summary.generado_por_id = generado_por_id
        summary.generado_at = datetime.utcnow()
        
        await summary.save()
        return summary
