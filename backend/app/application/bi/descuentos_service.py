from typing import List, Dict, Any, Optional
from datetime import datetime
from zoneinfo import ZoneInfo
import pandas as pd

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.bi.mongo_descuentos_repository import MongoDescuentosRepository, safe_float_bi
from app.schemas.bi_descuentos import (
    BIDescuentosImpactoResponse,
    KPIDescuentosBI,
    PromocionDetalleItemBI
)
from app.domain.models.user import User

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class DescuentosBIService:
    """
    Servicio de Aplicación de BI para Descuentos y Promociones.
    Procesa las colecciones operacionales MongoDB: descuentos y sales.
    Aplica Pandas ETL in-memory.
    """

    def __init__(self, repository: Optional[MongoDescuentosRepository] = None):
        self.repository = repository or MongoDescuentosRepository()

    async def get_descuentos_analysis(
        self,
        user: User,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        sucursal_id: Optional[str] = None
    ) -> BIDescuentosImpactoResponse:
        now_bolivia_dt = datetime.now(BOLIVIA_TZ)
        now_bolivia_str = now_bolivia_dt.strftime("%H:%M:%S")
        today_bolivia_str = now_bolivia_dt.strftime("%Y-%m-%d")

        tenant_id = str(user.tenant_id or "default")

        # 1. Extracción del Catálogo de Promociones y Ventas con Descuento
        catalog = await self.repository.get_raw_descuentos_catalog(tenant_id=tenant_id)
        sales_with_disc = await self.repository.get_raw_sales_with_discounts(
            user=user,
            start_date_str=start_date,
            end_date_str=end_date,
            sucursal_id=sucursal_id
        )

        promos_map: Dict[str, Dict[str, Any]] = {}
        for p in catalog:
            p_id = str(p["_id"])
            p_nom = str(p.get("nombre") or "Sin Nombre").strip()
            promos_map[p_nom.lower()] = {
                "id": p_id,
                "nombre": p_nom,
                "tipo": str(p.get("tipo") or "PORCENTAJE"),
                "valor": safe_float_bi(p.get("valor")),
                "is_active": bool(p.get("is_active", True)),
                "tickets_aplicados": 0,
                "monto_descuento_total": 0.0
            }

        # 2. Procesamiento de Ventas Operacionales con Descuento
        tickets_con_descuento_cnt = len(sales_with_disc)
        monto_total_descuentos = 0.0

        for s in sales_with_disc:
            d_obj = s.get("descuento")
            d_nombre: Optional[str] = None
            d_tipo = "PORCENTAJE"
            d_val = 0.0
            monto_desc = 0.0

            subt = safe_float_bi(s.get("subtotal") or s.get("total"))

            if isinstance(d_obj, dict):
                d_nombre = str(d_obj.get("nombre") or "Descuento General").strip()
                d_tipo = str(d_obj.get("tipo") or "PORCENTAJE")
                d_val = safe_float_bi(d_obj.get("valor"))
                if d_tipo == "MONTO":
                    monto_desc = d_val
                elif d_tipo == "PORCENTAJE":
                    monto_desc = round(subt * (d_val / 100.0), 2)
            elif isinstance(d_obj, (int, float)) and d_obj > 0:
                d_nombre = "Descuento Directo POS"
                d_tipo = "MONTO"
                d_val = safe_float_bi(d_obj)
                monto_desc = d_val
            elif s.get("descuento_monto") or s.get("monto_descuento") or s.get("cupon_descuento"):
                monto_val = safe_float_bi(s.get("descuento_monto") or s.get("monto_descuento") or s.get("cupon_descuento"))
                if monto_val > 0:
                    d_nombre = str(s.get("cupon") or "Descuento Cupon POS").strip()
                    d_tipo = "MONTO"
                    d_val = monto_val
                    monto_desc = monto_val

            # Descuento por ítems individuales (descuento_unitario)
            items_desc_total = 0.0
            items_list = s.get("items") or []
            if isinstance(items_list, list):
                for item in items_list:
                    if isinstance(item, dict):
                        d_u = safe_float_bi(item.get("descuento_unitario"))
                        cant = safe_float_bi(item.get("cantidad") or 1.0)
                        if d_u > 0:
                            items_desc_total += round(d_u * cant, 2)

            total_sale_discount = round(monto_desc + items_desc_total, 2)
            if total_sale_discount > 0:
                monto_total_descuentos += total_sale_discount

                if not d_nombre:
                    if items_desc_total > 0:
                        d_nombre = "Descuento Directo en Productos (SKU)"
                    elif s.get("cliente", {}).get("is_miembro_comunidad"):
                        d_nombre = "Comunidad Taboada - Recompensa Fidelidad"
                    else:
                        d_nombre = "Descuento General POS"

                norm_key = d_nombre.lower()
                if norm_key in promos_map:
                    promos_map[norm_key]["tickets_aplicados"] += 1
                    promos_map[norm_key]["monto_descuento_total"] += total_sale_discount
                else:
                    matched = False
                    for p_key in promos_map.keys():
                        if p_key in norm_key or norm_key in p_key:
                            promos_map[p_key]["tickets_aplicados"] += 1
                            promos_map[p_key]["monto_descuento_total"] += total_sale_discount
                            matched = True
                            break

                    if not matched:
                        promos_map[norm_key] = {
                            "id": str(s.get("_id")),
                            "nombre": d_nombre,
                            "tipo": d_tipo,
                            "valor": d_val if d_val > 0 else (items_desc_total if items_desc_total > 0 else total_sale_discount),
                            "is_active": True,
                            "tickets_aplicados": 1,
                            "monto_descuento_total": total_sale_discount
                        }

        monto_total_descuentos = round(monto_total_descuentos, 2)

        # 3. Lista de Promociones Detalle
        promociones_list: List[PromocionDetalleItemBI] = []
        for _, p_data in promos_map.items():
            promociones_list.append(
                PromocionDetalleItemBI(
                    promocion_id=p_data["id"],
                    nombre=p_data["nombre"],
                    tipo=p_data["tipo"],
                    valor=p_data["valor"],
                    is_active=p_data["is_active"],
                    tickets_aplicados=p_data["tickets_aplicados"],
                    monto_descuento_total=round(p_data["monto_descuento_total"], 2)
                )
            )

        promociones_list.sort(key=lambda x: (x.monto_descuento_total, x.tickets_aplicados), reverse=True)

        # 4. KPIs Globales
        promos_activas_cnt = sum(1 for p in catalog if p.get("is_active", True))

        prom_mas_usada_nom = "Sin datos"
        prom_mas_usada_monto = 0.0
        if promociones_list and promociones_list[0].tickets_aplicados > 0:
            prom_mas_usada_nom = promociones_list[0].nombre
            prom_mas_usada_monto = promociones_list[0].monto_descuento_total

        kpis = KPIDescuentosBI(
            promociones_configuradas=len(catalog),
            promociones_activas=promos_activas_cnt,
            tickets_con_descuento=tickets_con_descuento_cnt,
            monto_total_descuentos_otorgados=monto_total_descuentos,
            promocion_mas_usada_nombre=prom_mas_usada_nom,
            promocion_mas_usada_monto=prom_mas_usada_monto
        )

        return BIDescuentosImpactoResponse(
            status="success",
            fecha_consulta_bolivia=today_bolivia_str,
            timezone=BUSINESS_TIMEZONE,
            ultima_actualizacion=now_bolivia_str,
            kpis=kpis,
            promociones=promociones_list,
            trazabilidad={
                "coleccion": "descuentos & db.sales",
                "servicio": "DescuentosBIService (Clean Native)",
                "modelo_analitico": "Clean Architecture (FACT_DESCUENTOS_SALES)",
                "total_promociones_catalogo": len(catalog),
                "total_tickets_descuento": tickets_con_descuento_cnt,
                "suma_monto_descuentos": monto_total_descuentos,
                "roi_efectividad_causal": "NO_DISPONIBLE (Sin trazabilidad causal de origen de campaña en MongoDB)"
            }
        )
