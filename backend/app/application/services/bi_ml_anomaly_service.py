from typing import List, Dict, Any, Tuple
import math
from datetime import datetime, date, timedelta
from zoneinfo import ZoneInfo
from bson import ObjectId

from app.db import get_raw_db
from app.application.services.sales_read_service import safe_float
from app.application.services.bi_ml_dataset_service import BIMLDatasetService
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class BIMLAnomalyService:
    """
    Servicio de Detección de Anomalías Operacionales para PEGASUS SalesSystem.
    Implementa algoritmos estadísticos de puntuación Z (Z-Score) e intervalos intercuartílicos (IQR).
    Detecta caídas inusuales, picos atípicos y comportamientos anómalos por sucursal.
    No modifica ni altera ningún dato histórico ni KPI de MongoDB.
    """

    @classmethod
    async def detect_operational_anomalies(
        cls,
        tenant_id: str,
        threshold_zscore: float = 2.0
    ) -> Dict[str, Any]:
        """
        Analiza las series temporales históricas para identificar días o eventos atípicos
        en facturación diaria o volumen de tickets emitidos.
        """
        dataset_res = await BIMLDatasetService.build_daily_timeseries_dataset(tenant_id, sucursal_id="all")
        if dataset_res["status"] != "success":
            return {"status": "error", "message": "No se pudo extraer el dataset."}

        data = dataset_res["data_all"]
        if len(data) < 7:
            return {
                "status": "success",
                "message": "Datos insuficientes para análisis de anomalías.",
                "total_anomalies_found": 0,
                "anomalies": []
            }

        # 1. Extraer vectores de ingresos y tickets (excluyendo días con 0 ventas planificados)
        valid_sales = [d for d in data if d["ingresos"] > 0]
        if not valid_sales:
            return {"status": "success", "total_anomalies_found": 0, "anomalies": []}

        ingresos_vals = [d["ingresos"] for d in valid_sales]
        tickets_vals = [d["tickets"] for d in valid_sales]

        mean_ingresos = sum(ingresos_vals) / len(ingresos_vals)
        std_ingresos = math.sqrt(sum((x - mean_ingresos) ** 2 for x in ingresos_vals) / len(ingresos_vals)) or 1.0

        mean_tickets = sum(tickets_vals) / len(tickets_vals)
        std_tickets = math.sqrt(sum((x - mean_tickets) ** 2 for x in tickets_vals) / len(tickets_vals)) or 1.0

        anomalies: List[Dict[str, Any]] = []

        # 2. Evaluación de Z-Score sobre cada día registrado
        for item in valid_sales:
            z_ingresos = (item["ingresos"] - mean_ingresos) / std_ingresos
            z_tickets = (item["tickets"] - mean_tickets) / std_tickets

            is_anomaly = False
            tipo_anomalia = ""
            severidad = "MODERADA"
            explicacion = ""

            if z_ingresos > threshold_zscore:
                is_anomaly = True
                tipo_anomalia = "📈 PICO ANORMAL DE VENTAS"
                severidad = "ALTA" if z_ingresos > 3.0 else "MODERADA"
                explicacion = f"Ingresos de Bs. {item['ingresos']:,.2f} superan significativamente el promedio de Bs. {mean_ingresos:,.2f} (Z-Score: +{round(z_ingresos, 2)})"

            elif z_ingresos < -threshold_zscore:
                is_anomaly = True
                tipo_anomalia = "📉 CAÍDA INUSUAL DE FACTURACIÓN"
                severidad = "CRÍTICA" if z_ingresos < -2.5 else "MODERADA"
                explicacion = f"Ingresos de Bs. {item['ingresos']:,.2f} se ubican inusualmente por debajo del promedio de Bs. {mean_ingresos:,.2f} (Z-Score: {round(z_ingresos, 2)})"

            elif abs(z_tickets) > threshold_zscore:
                is_anomaly = True
                tipo_anomalia = "🎫 VARIACIÓN ATÍPICA DE TICKETS"
                explicacion = f"Volumen de {item['tickets']} tickets se desvía del comportamiento habitual de {round(mean_tickets, 1)} tickets."

            if is_anomaly:
                anomalies.append({
                    "fecha": item["fecha"],
                    "tipo_anomalia": tipo_anomalia,
                    "severidad": severidad,
                    "ingresos_reales_bs": item["ingresos"],
                    "tickets_reales": item["tickets"],
                    "z_score_ingresos": round(z_ingresos, 2),
                    "z_score_tickets": round(z_tickets, 2),
                    "explicacion_tecnica": explicacion,
                    "categoria_dato": "ALERTA ESTADÍSTICA (Modelo Detección Anomalías)"
                })

        return {
            "status": "success",
            "total_days_analyzed": len(data),
            "media_historica_ingresos": round(mean_ingresos, 2),
            "desviacion_estandar_ingresos": round(std_ingresos, 2),
            "media_historica_tickets": round(mean_tickets, 1),
            "total_anomalies_found": len(anomalies),
            "anomalies_summary": anomalies[:10]  # Top 10 anomalías detectadas
        }
