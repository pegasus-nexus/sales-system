from typing import List, Dict, Any, Optional
from datetime import datetime
from zoneinfo import ZoneInfo
import pandas as pd

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.bi.mongo_productividad_repository import MongoProductividadRepository, safe_float_bi
from app.schemas.bi_productividad import (
    BIProductividadDesempenoResponse,
    KPIProductividadBI,
    CajeroProductividadItemBI,
    EventoAuditoriaItemBI
)
from app.domain.models.user import User

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class ProductividadBIService:
    """
    Servicio de Aplicación de BI para Productividad de Cajeros y Auditoría Operacional.
    Procesa de forma limpia los documentos operacionales de MongoDB (sales, audit_logs).
    Aplica Pandas ETL in-memory.
    """

    def __init__(self, repository: Optional[MongoProductividadRepository] = None):
        self.repository = repository or MongoProductividadRepository()

    async def get_productividad_analysis(
        self,
        user: User,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        sucursal_id: Optional[str] = None
    ) -> BIProductividadDesempenoResponse:
        now_bolivia_dt = datetime.now(BOLIVIA_TZ)
        now_bolivia_str = now_bolivia_dt.strftime("%H:%M:%S")
        today_bolivia_str = now_bolivia_dt.strftime("%Y-%m-%d")

        s_date = start_date or today_bolivia_str
        e_date = end_date or today_bolivia_str

        # 1. Extracción de Ventas y Logs de Auditoría
        raw_sales = await self.repository.get_raw_sales_for_cashiers(
            user=user,
            start_date_str=s_date,
            end_date_str=e_date,
            sucursal_id=sucursal_id
        )

        tenant_id = str(user.tenant_id or "default")
        raw_audit = await self.repository.get_audit_logs_summary(tenant_id=tenant_id)

        if not raw_sales:
            return BIProductividadDesempenoResponse(
                status="success",
                fecha_inicio_bolivia=s_date,
                fecha_fin_bolivia=e_date,
                timezone=BUSINESS_TIMEZONE,
                ultima_actualizacion=now_bolivia_str,
                kpis=KPIProductividadBI(total_eventos_auditoria=len(raw_audit)),
                cajeros=[],
                auditoria_eventos=[]
            )

        # 2. DataFrame de Ventas por Cajero
        sales_rows = []
        for s in raw_sales:
            c_nom = str(s.get("cashier_name") or s.get("usuario_nombre") or s.get("vendedor_name") or "Cajero No Especificado").strip()
            tot = safe_float_bi(s.get("total"))
            sales_rows.append({
                "sale_id": str(s.get("_id")),
                "cajero_nombre": c_nom,
                "total": tot
            })

        df_sales = pd.DataFrame(sales_rows)
        ingresos_totales_global = round(float(df_sales["total"].sum()), 2)
        total_tickets_global = len(df_sales)

        # Agregación por Cajero
        grp_cajero = df_sales.groupby("cajero_nombre").agg(
            tickets_conteo=("sale_id", "count"),
            ingresos_bs=("total", "sum")
        ).reset_index()

        grp_cajero["ingresos_bs"] = grp_cajero["ingresos_bs"].round(2)
        grp_cajero["ticket_medio"] = (grp_cajero["ingresos_bs"] / grp_cajero["tickets_conteo"]).round(2)
        grp_cajero["participacion_pct"] = (grp_cajero["ingresos_bs"] / ingresos_totales_global * 100.0).round(2) if ingresos_totales_global > 0 else 0.0

        grp_cajero = grp_cajero.sort_values(by="ingresos_bs", ascending=False)

        cajeros_list: List[CajeroProductividadItemBI] = []
        for _, r in grp_cajero.iterrows():
            cajeros_list.append(
                CajeroProductividadItemBI(
                    cajero_nombre=str(r["cajero_nombre"]),
                    tickets_conteo=int(r["tickets_conteo"]),
                    ingresos_bs=float(r["ingresos_bs"]),
                    ticket_medio=float(r["ticket_medio"]),
                    participacion_pct=float(r["participacion_pct"])
                )
            )

        # 3. Resumen de Auditoría de Sistema
        df_audit = pd.DataFrame(raw_audit) if raw_audit else pd.DataFrame(columns=["action"])
        auditoria_list: List[EventoAuditoriaItemBI] = []

        if not df_audit.empty and "action" in df_audit.columns:
            grp_audit = df_audit.groupby("action")["_id"].count().reset_index()
            grp_audit.columns = ["accion", "total_eventos"]
            grp_audit = grp_audit.sort_values(by="total_eventos", ascending=False)
            for _, r in grp_audit.iterrows():
                auditoria_list.append(
                    EventoAuditoriaItemBI(
                        accion=str(r["accion"]),
                        total_eventos=int(r["total_eventos"])
                    )
                )

        # 4. KPIs Globales
        cajero_lider_nom = "Sin datos"
        cajero_lider_monto = 0.0
        cajero_mayor_tm_nom = "Sin datos"
        cajero_mayor_tm_monto = 0.0

        if cajeros_list:
            cajero_lider_nom = cajeros_list[0].cajero_nombre
            cajero_lider_monto = cajeros_list[0].ingresos_bs

            best_tm = max(cajeros_list, key=lambda x: x.ticket_medio)
            cajero_mayor_tm_nom = best_tm.cajero_nombre
            cajero_mayor_tm_monto = best_tm.ticket_medio

        kpis = KPIProductividadBI(
            ingresos_totales=ingresos_totales_global,
            total_tickets=total_tickets_global,
            cajeros_activos_con_venta=len(cajeros_list),
            cajero_lider_nombre=cajero_lider_nom,
            cajero_lider_ingresos=cajero_lider_monto,
            cajero_mayor_ticket_medio_nombre=cajero_mayor_tm_nom,
            cajero_mayor_ticket_medio_monto=cajero_mayor_tm_monto,
            total_eventos_auditoria=len(raw_audit)
        )

        return BIProductividadDesempenoResponse(
            status="success",
            fecha_inicio_bolivia=s_date,
            fecha_fin_bolivia=e_date,
            timezone=BUSINESS_TIMEZONE,
            ultima_actualizacion=now_bolivia_str,
            kpis=kpis,
            cajeros=cajeros_list,
            auditoria_eventos=auditoria_list,
            trazabilidad={
                "coleccion": "sales.cashier_name & db.audit_logs & db.users",
                "servicio": "ProductividadBIService (Clean Native)",
                "modelo_analitico": "Clean Architecture (FACT_CASHIER_PERFORMANCE)",
                "total_tickets_procesados": total_tickets_global,
                "suma_facturacion_cajeros": ingresos_totales_global,
                "cajeros_activos": len(cajeros_list),
                "total_eventos_auditoria": len(raw_audit),
                "horas_trabajadas_eficiencia": "NO_DISPONIBLE (Sin marcado de asistencia ni reloj marcador en MongoDB)",
                "alertas_fraude": "NO_DISPONIBLE (Sin reglas de auditoria de fraude en MongoDB)"
            }
        )
