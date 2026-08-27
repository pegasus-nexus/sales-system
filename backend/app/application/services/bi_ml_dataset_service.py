from typing import List, Dict, Any, Tuple
from datetime import datetime, date, timedelta
from zoneinfo import ZoneInfo
from bson import ObjectId

from app.db import get_raw_db
from app.application.services.sales_read_service import safe_float
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class BIMLDatasetService:
    """
    Servicio de preparación de Datasets Históricos para Machine Learning y Predicciones en BI.
    Respeta Clean Architecture y Tenant Isolation.
    Garantiza Cero Data Leakage y Split Temporal Cronológico.
    """

    @staticmethod
    async def build_daily_timeseries_dataset(
        tenant_id: str,
        sucursal_id: str = "all"
    ) -> Dict[str, Any]:
        """
        Construye una serie temporal diaria continua desde la primera venta registrada hasta la última,
        rellenando días vacíos con 0.00 e imputando características temporales históricas (lags y rolling means).
        """
        db = await get_raw_db()
        tenant_filter: Dict[str, Any] = {
            "tenant_id": {"$in": [tenant_id, ObjectId(tenant_id)]},
            "anulada": {"$ne": True}
        }
        if sucursal_id != "all":
            tenant_filter["sucursal_id"] = sucursal_id

        # 1. Obtener primera y última fecha de transacciones
        first_sale = await db.sales.find_one(tenant_filter, sort=[("created_at", 1)])
        last_sale = await db.sales.find_one(tenant_filter, sort=[("created_at", -1)])

        if not first_sale or not last_sale:
            return {
                "status": "empty",
                "message": "No hay datos suficientes de ventas para construir el dataset de ML.",
                "total_records": 0,
                "data": []
            }

        min_utc = first_sale.get("created_at")
        max_utc = last_sale.get("created_at")

        start_date_bol = min_utc.astimezone(BOLIVIA_TZ).date()
        end_date_bol = max_utc.astimezone(BOLIVIA_TZ).date()

        # 2. Agregación diaria por fecha en America/La_Paz
        pipeline = [
            {"$match": tenant_filter},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$created_at",
                            "timezone": BUSINESS_TIMEZONE
                        }
                    },
                    "total_ingresos": {"$sum": "$total"},
                    "total_tickets": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]

        raw_agg = await db.sales.aggregate(pipeline).to_list(length=None)
        daily_dict = {
            doc["_id"]: {
                "ingresos": safe_float(doc["total_ingresos"]),
                "tickets": int(doc["total_tickets"])
            }
            for doc in raw_agg
        }

        # 3. Construir serie continua completa (Rellenar días sin ventas con 0)
        curr_date = start_date_bol
        continuous_series: List[Dict[str, Any]] = []

        while curr_date <= end_date_bol:
            date_str = curr_date.strftime("%Y-%m-%d")
            entry = daily_dict.get(date_str, {"ingresos": 0.0, "tickets": 0})
            
            day_of_week = curr_date.weekday()  # 0=Lunes, 6=Domingo
            is_weekend = 1 if day_of_week in (5, 6) else 0

            continuous_series.append({
                "fecha": date_str,
                "ingresos": entry["ingresos"],
                "tickets": entry["tickets"],
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "day_of_month": curr_date.day,
                "month": curr_date.month,
                "year": curr_date.year
            })
            curr_date += timedelta(days=1)

        # 4. Cálculo de Features Temporales sin Data Leakage (Lags y Rolling Means)
        total_len = len(continuous_series)
        for i in range(total_len):
            # Lag 1 día
            continuous_series[i]["lag_1d_ingresos"] = continuous_series[i - 1]["ingresos"] if i >= 1 else 0.0
            continuous_series[i]["lag_1d_tickets"] = continuous_series[i - 1]["tickets"] if i >= 1 else 0

            # Lag 7 días
            continuous_series[i]["lag_7d_ingresos"] = continuous_series[i - 7]["ingresos"] if i >= 7 else 0.0
            continuous_series[i]["lag_7d_tickets"] = continuous_series[i - 7]["tickets"] if i >= 7 else 0

            # Rolling Mean 7 días pasados (excluyendo el día actual)
            if i >= 7:
                past_7 = [continuous_series[j]["ingresos"] for j in range(i - 7, i)]
                continuous_series[i]["rolling_mean_7d"] = round(sum(past_7) / 7.0, 2)
            else:
                continuous_series[i]["rolling_mean_7d"] = 0.0

        # 5. Split Temporal Cronológico (80% Train / 20% Validation/Test)
        split_idx = int(total_len * 0.8)
        train_set = continuous_series[:split_idx]
        val_test_set = continuous_series[split_idx:]

        return {
            "status": "success",
            "tenant_id": tenant_id,
            "sucursal_id": sucursal_id,
            "start_date": start_date_bol.strftime("%Y-%m-%d"),
            "end_date": end_date_bol.strftime("%Y-%m-%d"),
            "total_days_continuous": total_len,
            "train_days_count": len(train_set),
            "val_test_days_count": len(val_test_set),
            "split_ratio": "80% Train / 20% Validation",
            "features_extracted": [
                "fecha", "ingresos", "tickets", "day_of_week", "is_weekend",
                "day_of_month", "month", "year", "lag_1d_ingresos", "lag_7d_ingresos", "rolling_mean_7d"
            ],
            "data_sample_head": continuous_series[:3],
            "data_sample_tail": continuous_series[-3:],
            "data_all": continuous_series
        }
