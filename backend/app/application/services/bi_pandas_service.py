from typing import List, Dict, Any, Optional
from datetime import datetime, date
from zoneinfo import ZoneInfo
import pandas as pd

from app.core.config import BUSINESS_TIMEZONE
from app.schemas.bi import (
    BIPanelGeneralResponse,
    DesgloseSucursalBI,
    HourlyDistributionItemBI
)

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class BIPandasService:
    """
    Capa Analítica de Transformación y Normalización con Pandas.
    Estructura los datos de MongoDB en un Modelo Estrella (Star Schema) in-memory,
    convierte la zona horaria a America/La_Paz y calcula vectorialmente los KPIs.
    """

    def process_panel_general(
        self,
        raw_sales: List[Dict[str, Any]],
        sucursales: List[Dict[str, Any]],
        start_date_str: str,
        end_date_str: str
    ) -> BIPanelGeneralResponse:
        now_bolivia_str = datetime.now(BOLIVIA_TZ).strftime("%Y-%m-%d %H:%M:%S")

        # 1. Dimensión Sucursal
        df_dim_sucursal = pd.DataFrame(sucursales)
        if df_dim_sucursal.empty:
            df_dim_sucursal = pd.DataFrame(columns=["sucursal_id", "nombre", "ciudad", "direccion"])
        else:
            if "sucursal_id" not in df_dim_sucursal.columns:
                df_dim_sucursal["sucursal_id"] = ""

        # Manejo de dataset vacío de ventas
        if not raw_sales:
            desglose_sucursales_empty = [
                DesgloseSucursalBI(
                    sucursal_id=row.get("sucursal_id", ""),
                    nombre_sucursal=row.get("nombre", "Sin Nombre"),
                    ingresos=0.0,
                    ordenes=0,
                    ticket_medio=0.0
                )
                for _, row in df_dim_sucursal.iterrows()
            ] if not df_dim_sucursal.empty else []

            hourly_empty = [
                HourlyDistributionItemBI(
                    hora=h,
                    rango=f"{h:02d}:00 - {(h+1)%24:02d}:00",
                    ingresos=0.0,
                    ordenes=0
                )
                for h in range(24)
            ]

            return BIPanelGeneralResponse(
                fecha_inicio_bolivia=start_date_str,
                fecha_fin_bolivia=end_date_str,
                timezone=BUSINESS_TIMEZONE,
                estado_sincronizacion="Sincronizado",
                ultima_actualizacion=now_bolivia_str,
                ingresos_totales=0.0,
                cantidad_ordenes=0,
                ticket_medio=0.0,
                desglose_sucursales=desglose_sucursales_empty,
                ventas_por_hora=hourly_empty
            )

        # 2. DataFrame de Ventas Raw
        df_sales = pd.DataFrame(raw_sales)

        # Garantizar que las columnas esperadas existan
        for col in ["_id", "tenant_id", "sucursal_id", "total", "estado_pago", "idempotency_key"]:
            if col not in df_sales.columns:
                df_sales[col] = "PAGADO" if col == "estado_pago" else ""

        # 3. Clean & Deduplicate por idempotency_key o _id
        if "idempotency_key" in df_sales.columns:
            # Deduplicar preservando el primer registro válido cuando idempotency_key esté presente
            valid_idemp = df_sales[df_sales["idempotency_key"].notna() & (df_sales["idempotency_key"] != "")]
            if not valid_idemp.empty:
                dup_keys = valid_idemp[valid_idemp.duplicated("idempotency_key")]["_id"]
                df_sales = df_sales[~df_sales["_id"].isin(dup_keys)]
        df_sales = df_sales.drop_duplicates(subset=["_id"], keep="first")

        # 4. Normalizar timestamps a UTC y luego a America/La_Paz
        df_sales["created_at_utc"] = pd.to_datetime(df_sales["created_at"], utc=True)
        df_sales["fecha_hora_bolivia"] = df_sales["created_at_utc"].dt.tz_convert(BOLIVIA_TZ)

        # 5. Derivar Atributos Temporales en hora de Bolivia
        df_sales["fecha_bolivia"] = df_sales["fecha_hora_bolivia"].dt.date
        df_sales["hora_bolivia"] = df_sales["fecha_hora_bolivia"].dt.hour
        df_sales["anio"] = df_sales["fecha_hora_bolivia"].dt.year
        df_sales["mes"] = df_sales["fecha_hora_bolivia"].dt.month
        df_sales["dia_semana"] = df_sales["fecha_hora_bolivia"].dt.dayofweek

        # 6. Construcción del MODELO ESTRELLA (FACT_VENTAS)
        # Granularidad: 1 fila por Ticket/Venta válida
        fact_ventas = df_sales[[
            "_id", "tenant_id", "sucursal_id", "total", "estado_pago",
            "created_at_utc", "fecha_hora_bolivia", "fecha_bolivia", "hora_bolivia"
        ]].copy()
        fact_ventas.rename(columns={"_id": "ticket_id", "total": "total_neto"}, inplace=True)

        # 7. Cálculo de KPIs Globales
        ingresos_totales = round(float(fact_ventas["total_neto"].sum()), 2)
        cantidad_ordenes = int(fact_ventas["ticket_id"].nunique())
        ticket_medio = round(ingresos_totales / cantidad_ordenes, 2) if cantidad_ordenes > 0 else 0.0

        # 8. Desglose por Sucursal (Fact_Ventas JOIN Dim_Sucursal)
        desglose_list: List[DesgloseSucursalBI] = []
        if not fact_ventas.empty:
            suc_group = fact_ventas.groupby("sucursal_id").agg(
                ingresos=("total_neto", "sum"),
                ordenes=("ticket_id", "nunique")
            ).reset_index()

            # Merge con Dimensión Sucursales para incluir nombres reales
            if not df_dim_sucursal.empty and "sucursal_id" in df_dim_sucursal.columns:
                merged_suc = pd.merge(
                    df_dim_sucursal,
                    suc_group,
                    on="sucursal_id",
                    how="left"
                )
            else:
                merged_suc = suc_group
                merged_suc["nombre"] = merged_suc["sucursal_id"]

            merged_suc["ingresos"] = merged_suc["ingresos"].fillna(0.0)
            merged_suc["ordenes"] = merged_suc["ordenes"].fillna(0).astype(int)

            for _, row in merged_suc.iterrows():
                ing = round(float(row["ingresos"]), 2)
                ord_count = int(row["ordenes"])
                tm = round(ing / ord_count, 2) if ord_count > 0 else 0.0
                desglose_list.append(
                    DesgloseSucursalBI(
                        sucursal_id=str(row["sucursal_id"]),
                        nombre_sucursal=str(row.get("nombre", row["sucursal_id"])),
                        ingresos=ing,
                        ordenes=ord_count,
                        ticket_medio=tm
                    )
                )

        # 9. Distribución Horaria 0..23 (Hora Bolivia)
        hourly_group = fact_ventas.groupby("hora_bolivia").agg(
            ingresos=("total_neto", "sum"),
            ordenes=("ticket_id", "nunique")
        ).to_dict(orient="index")

        hourly_list: List[HourlyDistributionItemBI] = []
        for h in range(24):
            h_data = hourly_group.get(h, {"ingresos": 0.0, "ordenes": 0})
            hourly_list.append(
                HourlyDistributionItemBI(
                    hora=h,
                    rango=f"{h:02d}:00 - {(h+1)%24:02d}:00",
                    ingresos=round(float(h_data["ingresos"]), 2),
                    ordenes=int(h_data["ordenes"])
                )
            )

        return BIPanelGeneralResponse(
            fecha_inicio_bolivia=start_date_str,
            fecha_fin_bolivia=end_date_str,
            timezone=BUSINESS_TIMEZONE,
            estado_sincronizacion="Sincronizado",
            ultima_actualizacion=now_bolivia_str,
            ingresos_totales=ingresos_totales,
            cantidad_ordenes=cantidad_ordenes,
            ticket_medio=ticket_medio,
            desglose_sucursales=desglose_list,
            ventas_por_hora=hourly_list
        )
