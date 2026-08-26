from typing import List, Dict, Any, Optional
from datetime import datetime
from zoneinfo import ZoneInfo
import pandas as pd

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.bi.mongo_sucursales_repository import MongoSucursalesRepository, safe_float_bi
from app.schemas.bi_sucursales import (
    BISucursalesDesempenoResponse,
    KPISucursalesBI,
    SucursalDesempenoItemBI
)
from app.domain.models.user import User

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class SucursalesBIService:
    """
    Servicio de Aplicación de BI para Desempeño Operativo por Sucursales.
    Procesa los documentos operacionales de MongoDB (sales, sucursales) aplicando Pandas ETL in-memory.
    Garantiza la regla matemática: SUM(ventas por sucursal) == SUM(sales.total).
    """

    def __init__(self, repository: Optional[MongoSucursalesRepository] = None):
        self.repository = repository or MongoSucursalesRepository()

    async def get_sucursales_analysis(
        self,
        user: User,
        start_date: str,
        end_date: str,
        sucursal_id: Optional[str] = None
    ) -> BISucursalesDesempenoResponse:
        now_bolivia_str = datetime.now(BOLIVIA_TZ).strftime("%H:%M:%S")

        # 1. Extracción de Ventas Operacionales y Dimensión Sucursales
        raw_sales = await self.repository.get_raw_sales_for_period(
            user=user,
            start_date_str=start_date,
            end_date_str=end_date,
            sucursal_id=sucursal_id
        )

        tenant_id = str(user.tenant_id or "default")
        sucursales_dim = await self.repository.get_sucursales_dim(tenant_id=tenant_id)

        if not raw_sales:
            return BISucursalesDesempenoResponse(
                status="success",
                fecha_inicio_bolivia=start_date,
                fecha_fin_bolivia=end_date,
                timezone=BUSINESS_TIMEZONE,
                ultima_actualizacion=now_bolivia_str,
                kpis=KPISucursalesBI(),
                sucursales=[]
            )

        # 2. DataFrame de Ventas por Sucursal
        sales_rows = []
        for sale in raw_sales:
            s_total = safe_float_bi(sale.get("total"))
            s_id = str(sale.get("_id"))
            suc_id = str(sale.get("sucursal_id") or "SIN_SUCURSAL")

            sales_rows.append({
                "ticket_id": s_id,
                "sucursal_id": suc_id,
                "total": s_total
            })

        df_sales = pd.DataFrame(sales_rows)
        ingresos_totales_global = round(float(df_sales["total"].sum()), 2)
        total_tickets_global = len(df_sales)
        ticket_medio_global = round(ingresos_totales_global / total_tickets_global, 2) if total_tickets_global > 0 else 0.0

        # Agregación por sucursal
        grp_suc = df_sales.groupby("sucursal_id").agg(
            tickets_conteo=("ticket_id", "count"),
            ingresos_bs=("total", "sum")
        ).reset_index()

        grp_suc["ingresos_bs"] = grp_suc["ingresos_bs"].round(2)
        grp_suc["ticket_medio"] = (grp_suc["ingresos_bs"] / grp_suc["tickets_conteo"]).round(2).fillna(0.0)
        grp_suc["participacion_pct"] = (grp_suc["ingresos_bs"] / ingresos_totales_global * 100.0).round(2) if ingresos_totales_global > 0 else 0.0

        # 3. DataFrame de Dimensión Sucursales
        df_suc_dim = pd.DataFrame(sucursales_dim) if sucursales_dim else pd.DataFrame()
        if not df_suc_dim.empty and "_id" in df_suc_dim.columns:
            df_suc_dim["_id"] = df_suc_dim["_id"].astype(str)
            df_suc_dim.rename(columns={"_id": "sucursal_id"}, inplace=True)
        else:
            df_suc_dim = pd.DataFrame(columns=["sucursal_id", "nombre", "ciudad", "direccion", "is_active"])

        df_merged = pd.merge(grp_suc, df_suc_dim, on="sucursal_id", how="left")
        df_merged["nombre"] = df_merged["nombre"].fillna("Sucursal Sin Registro DB")
        df_merged["ciudad"] = df_merged["ciudad"].fillna("Sin Ciudad")
        df_merged["direccion"] = df_merged["direccion"].fillna("")
        df_merged["is_active"] = df_merged["is_active"].fillna(True)

        df_merged = df_merged.sort_values(by="ingresos_bs", ascending=False)

        # 4. Formateo de Lista de Sucursales
        sucursales_list: List[SucursalDesempenoItemBI] = []
        for _, r in df_merged.iterrows():
            sucursales_list.append(
                SucursalDesempenoItemBI(
                    sucursal_id=str(r["sucursal_id"]),
                    nombre=str(r["nombre"]),
                    ciudad=str(r["ciudad"]),
                    direccion=str(r["direccion"]),
                    is_active=bool(r["is_active"]),
                    tickets_conteo=int(r["tickets_conteo"]),
                    ingresos_bs=float(r["ingresos_bs"]),
                    ticket_medio=float(r["ticket_medio"]),
                    participacion_pct=float(r["participacion_pct"])
                )
            )

        # 5. Cálculo de KPIs
        sucursal_lider_nom = "Sin datos"
        sucursal_lider_ing = 0.0
        sucursal_top_tm_nom = "Sin datos"
        sucursal_top_tm_monto = 0.0

        if sucursales_list:
            top_rec = sucursales_list[0]
            sucursal_lider_nom = top_rec.nombre
            sucursal_lider_ing = top_rec.ingresos_bs

            top_tm = max(sucursales_list, key=lambda x: x.ticket_medio)
            sucursal_top_tm_nom = top_tm.nombre
            sucursal_top_tm_monto = top_tm.ticket_medio

        kpis = KPISucursalesBI(
            ingresos_totales=ingresos_totales_global,
            total_tickets=total_tickets_global,
            ticket_medio_global=ticket_medio_global,
            total_sucursales_activas_con_venta=len(sucursales_list),
            sucursal_lider_nombre=sucursal_lider_nom,
            sucursal_lider_ingresos=sucursal_lider_ing,
            sucursal_mayor_ticket_medio_nombre=sucursal_top_tm_nom,
            sucursal_mayor_ticket_medio_monto=sucursal_top_tm_monto
        )

        return BISucursalesDesempenoResponse(
            status="success",
            fecha_inicio_bolivia=start_date,
            fecha_fin_bolivia=end_date,
            timezone=BUSINESS_TIMEZONE,
            ultima_actualizacion=now_bolivia_str,
            kpis=kpis,
            sucursales=sucursales_list,
            trazabilidad={
                "coleccion": "sales & db.sucursales",
                "servicio": "SucursalesBIService (Clean Native)",
                "modelo_analitico": "Clean Architecture (FACT_SALES_SUCURSALES)",
                "filtro_anuladas": "anulada != True",
                "total_tickets_procesados": total_tickets_global,
                "suma_ingresos_sucursales": round(sum(s.ingresos_bs for s in sucursales_list), 2),
                "suma_sales_total": ingresos_totales_global
            }
        )
