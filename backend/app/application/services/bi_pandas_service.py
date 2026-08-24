from typing import List, Dict, Any, Optional
from datetime import datetime
from zoneinfo import ZoneInfo
import pandas as pd

from app.core.config import BUSINESS_TIMEZONE
from app.schemas.bi import (
    BIPanelGeneralResponse,
    DesgloseSucursalBI,
    HourlyDistributionItemBI,
    VentaRecienteBI,
    ResumenOperativoBI,
    AlertaOperativaBI
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
        now_bolivia_str = datetime.now(BOLIVIA_TZ).strftime("%H:%M:%S")

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
                    sucursal_id=str(row.get("sucursal_id", "")),
                    nombre_sucursal=str(row.get("nombre", "Sin Nombre")),
                    ingresos=0.0,
                    ordenes=0,
                    ticket_medio=0.0,
                    participacion_pct=0.0
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
                estado_sincronizacion="Datos sincronizados con POS",
                ultima_actualizacion=now_bolivia_str,
                ingresos_totales=0.0,
                cantidad_ordenes=0,
                ticket_medio=0.0,
                desglose_sucursales=desglose_sucursales_empty,
                ventas_por_hora=hourly_empty,
                ventas_recientes=[],
                resumen_operativo=ResumenOperativoBI(),
                alertas_operativas=[
                    AlertaOperativaBI(
                        tipo="info",
                        titulo="Sin ventas en el período",
                        mensaje="No se encontraron tickets registrados por el POS en la fecha o rango de fechas seleccionado."
                    )
                ]
            )

        # 2. DataFrame de Ventas Raw
        df_sales = pd.DataFrame(raw_sales)

        for col in ["_id", "tenant_id", "sucursal_id", "total", "estado_pago", "idempotency_key", "created_at", "numero_ticket"]:
            if col not in df_sales.columns:
                if col == "estado_pago":
                    df_sales[col] = "PAGADO"
                elif col == "sucursal_id":
                    df_sales[col] = "CENTRAL"
                elif col == "numero_ticket":
                    df_sales[col] = df_sales["_id"].astype(str) if "_id" in df_sales.columns else "N/A"
                else:
                    df_sales[col] = ""

        df_sales["sucursal_id"] = df_sales["sucursal_id"].fillna("CENTRAL").astype(str)

        # 3. Clean & Deduplicate por idempotency_key o _id
        if "idempotency_key" in df_sales.columns:
            valid_idemp = df_sales[df_sales["idempotency_key"].notna() & (df_sales["idempotency_key"] != "")]
            if not valid_idemp.empty:
                dup_keys = valid_idemp[valid_idemp.duplicated("idempotency_key")]["_id"]
                df_sales = df_sales[~df_sales["_id"].isin(dup_keys)]
        df_sales = df_sales.drop_duplicates(subset=["_id"], keep="first")

        # 4. Normalizar timestamps a UTC y luego a America/La_Paz
        df_sales["created_at_utc"] = pd.to_datetime(df_sales["created_at"], utc=True, errors="coerce")
        df_sales["created_at_utc"] = df_sales["created_at_utc"].fillna(pd.Timestamp.now(tz="UTC"))
        df_sales["fecha_hora_bolivia"] = df_sales["created_at_utc"].dt.tz_convert(BOLIVIA_TZ)

        df_sales["fecha_bolivia"] = df_sales["fecha_hora_bolivia"].dt.date
        df_sales["hora_bolivia"] = df_sales["fecha_hora_bolivia"].dt.hour
        df_sales["hora_minuto_bolivia"] = df_sales["fecha_hora_bolivia"].dt.strftime("%H:%M:%S")

        # 5. MODELO ESTRELLA (FACT_VENTAS)
        fact_ventas = df_sales[[
            "_id", "numero_ticket", "tenant_id", "sucursal_id", "total", "estado_pago",
            "created_at_utc", "fecha_hora_bolivia", "fecha_bolivia", "hora_bolivia", "hora_minuto_bolivia"
        ]].copy()
        fact_ventas.rename(columns={"_id": "ticket_id", "total": "total_neto"}, inplace=True)

        # 6. KPIs Globales
        ingresos_totales = round(float(fact_ventas["total_neto"].sum()), 2)
        cantidad_ordenes = int(fact_ventas["ticket_id"].nunique())
        ticket_medio = round(ingresos_totales / cantidad_ordenes, 2) if cantidad_ordenes > 0 else 0.0

        # 7. Desglose por Sucursal
        desglose_list: List[DesgloseSucursalBI] = []
        suc_lider_nombre = "Sin actividad"
        if not fact_ventas.empty:
            suc_group = fact_ventas.groupby("sucursal_id").agg(
                ingresos=("total_neto", "sum"),
                ordenes=("ticket_id", "nunique")
            ).reset_index()

            if not df_dim_sucursal.empty and "sucursal_id" in df_dim_sucursal.columns:
                merged_suc = pd.merge(suc_group, df_dim_sucursal, on="sucursal_id", how="left")
            else:
                merged_suc = suc_group
                merged_suc["nombre"] = merged_suc["sucursal_id"]

            merged_suc["ingresos"] = merged_suc["ingresos"].fillna(0.0)
            merged_suc["ordenes"] = merged_suc["ordenes"].fillna(0).astype(int)

            max_ing = -1.0
            for _, row in merged_suc.iterrows():
                ing = round(float(row["ingresos"]), 2)
                ord_count = int(row["ordenes"])
                tm = round(ing / ord_count, 2) if ord_count > 0 else 0.0
                pct = round((ing / ingresos_totales * 100), 1) if ingresos_totales > 0 else 0.0

                nombre_raw = row.get("nombre")
                if pd.isna(nombre_raw) or not str(nombre_raw).strip():
                    nombre_suc = "Central / Principal" if str(row["sucursal_id"]) == "CENTRAL" else f"Sucursal ({row['sucursal_id'][:8]})"
                else:
                    nombre_suc = str(nombre_raw)

                if ing > max_ing:
                    max_ing = ing
                    suc_lider_nombre = nombre_suc

                desglose_list.append(
                    DesgloseSucursalBI(
                        sucursal_id=str(row["sucursal_id"]),
                        nombre_sucursal=nombre_suc,
                        ingresos=ing,
                        ordenes=ord_count,
                        ticket_medio=tm,
                        participacion_pct=pct
                    )
                )

        # 8. Distribución Horaria 0..23 (Hora Bolivia)
        hourly_group = fact_ventas.groupby("hora_bolivia").agg(
            ingresos=("total_neto", "sum"),
            ordenes=("ticket_id", "nunique")
        ).to_dict(orient="index")

        hourly_list: List[HourlyDistributionItemBI] = []
        max_h_ing = -1.0
        mejor_hora_str = "00:00"
        for h in range(24):
            h_data = hourly_group.get(h, {"ingresos": 0.0, "ordenes": 0})
            ing_h = round(float(h_data["ingresos"]), 2)
            if ing_h > max_h_ing:
                max_h_ing = ing_h
                mejor_hora_str = f"{h:02d}:00"

            hourly_list.append(
                HourlyDistributionItemBI(
                    hora=h,
                    rango=f"{h:02d}:00 - {(h+1)%24:02d}:00",
                    ingresos=ing_h,
                    ordenes=int(h_data["ordenes"])
                )
            )

        # 9. Ventas Recientes (Últimas 5 ordenadas por timestamp Bolivia desc)
        df_recent = fact_ventas.sort_values(by="fecha_hora_bolivia", ascending=False).head(5)
        ventas_recientes_list: List[VentaRecienteBI] = []
        for _, row in df_recent.iterrows():
            suc_name = "Central / Principal"
            found_suc = [s for s in desglose_list if s.sucursal_id == str(row["sucursal_id"])]
            if found_suc:
                suc_name = found_suc[0].nombre_sucursal

            ventas_recientes_list.append(
                VentaRecienteBI(
                    ticket_id=str(row["ticket_id"]),
                    numero_ticket=str(row.get("numero_ticket") or row["ticket_id"]),
                    hora_bolivia=str(row["hora_minuto_bolivia"]),
                    nombre_sucursal=suc_name,
                    total_neto=round(float(row["total_neto"]), 2),
                    estado_pago=str(row.get("estado_pago", "PAGADO"))
                )
            )

        ultima_hora = ventas_recientes_list[0].hora_bolivia if ventas_recientes_list else "Sin registros"
        prom_hora = round(ingresos_totales / 24, 2)

        resumen_operativo = ResumenOperativoBI(
            sucursal_lider=suc_lider_nombre,
            mejor_hora=mejor_hora_str,
            promedio_por_hora=prom_hora,
            ultima_venta_hora=ultima_hora
        )

        alertas: List[AlertaOperativaBI] = []
        if cantidad_ordenes > 0:
            alertas.append(
                AlertaOperativaBI(
                    tipo="info",
                    titulo="POS Activo",
                    mensaje=f"Se han procesado {cantidad_ordenes} órdenes válidas correctamente en hora de Bolivia."
                )
            )

        return BIPanelGeneralResponse(
            fecha_inicio_bolivia=start_date_str,
            fecha_fin_bolivia=end_date_str,
            timezone=BUSINESS_TIMEZONE,
            estado_sincronizacion="Datos sincronizados con POS",
            ultima_actualizacion=now_bolivia_str,
            ingresos_totales=ingresos_totales,
            cantidad_ordenes=cantidad_ordenes,
            ticket_medio=ticket_medio,
            desglose_sucursales=desglose_list,
            ventas_por_hora=hourly_list,
            ventas_recientes=ventas_recientes_list,
            resumen_operativo=resumen_operativo,
            alertas_operativas=alertas
        )
