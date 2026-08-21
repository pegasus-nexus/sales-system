from datetime import date, datetime, timedelta
from typing import Dict, Any, List
import math
from app.infrastructure.repositories.mongo_analytics_repository import MongoAnalyticsRepository
from app.utils.date_utils import get_day_range_bolivia
from app.db import get_raw_db

DEFAULT_TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

def clean_nans(obj):
    if isinstance(obj, dict):
        return {k: clean_nans(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nans(x) for x in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return 0.0
        return obj
    return obj

def _same_day_prev_year(ref: date, years_back: int) -> date:
    return ref - timedelta(days=364 * years_back)

async def _fetch_hourly_for_date(tenant_id: str, d: date, sucursal: str = None) -> Dict[int, float]:
    real_tenant_id = tenant_id if tenant_id and str(tenant_id).lower() not in ["none", "null", "undefined", ""] else DEFAULT_TENANT_ID

    # 1. Si el año es 2026 o superior, consultar ventas en vivo de POS (db.sales)
    if d.year >= 2026:
        repo = MongoAnalyticsRepository()
        start_dt, end_dt = get_day_range_bolivia(d.strftime("%Y-%m-%d"))
        dist = await repo.get_hourly_sales_distribution(real_tenant_id, start_dt, end_dt, sucursal)
        return {h["_id"]: float(h.get("total_ventas", 0)) for h in dist if h["_id"] is not None}

    # 2. Para años anteriores (2025, 2024, etc.), consultar siempre la colección histórica real (db.ventas_historicas_crudas)
    db = await get_raw_db()
    start_hist = datetime(d.year, d.month, d.day, 0, 0, 0)
    end_hist = datetime(d.year, d.month, d.day, 23, 59, 59)

    match_stage: Dict[str, Any] = {
        "fecha_transaccion": {"$gte": start_hist, "$lte": end_hist},
        "estado": {"$ne": "anulado"}
    }

    if sucursal and sucursal.lower() not in ["all", "todas", "global", ""]:
        if "hero" in sucursal.lower():
            match_stage["sucursal"] = {"$regex": "Hero", "$options": "i"}
        elif "recoleta" in sucursal.lower():
            match_stage["sucursal"] = {"$regex": "^Recoleta$", "$options": "i"}
        elif "calacoto" in sucursal.lower():
            match_stage["sucursal"] = {"$regex": "^Calacoto$", "$options": "i"}
        else:
            match_stage["sucursal"] = {"$regex": sucursal, "$options": "i"}

    pipeline = [
        {"$match": match_stage},
        {
            "$project": {
                "monto": {"$toDouble": "$monto_total_bs"},
                "hour": {"$hour": {"date": "$fecha_transaccion", "timezone": "-04:00"}}
            }
        },
        {"$match": {"monto": {"$gt": 0}}},
        {
            "$group": {
                "_id": "$hour",
                "total": {"$sum": "$monto"}
            }
        },
        {"$sort": {"_id": 1}}
    ]

    res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(100)
    return {r["_id"]: float(r["total"]) for r in res if r["_id"] is not None}

async def get_hourly_multiyear(
    tenant_id: str,
    fecha_referencia: date,
    fecha_anio1: date = None,
    fecha_anio2: date = None,
    sucursal: str = None,
) -> Dict[str, Any]:
    try:
        f0 = fecha_referencia
        f1 = fecha_anio1 or _same_day_prev_year(f0, 1)
        f2 = fecha_anio2 or _same_day_prev_year(f0, 2)

        # Consultar cada año (2026 en sales, 2025 y 2024 en ventas_historicas_crudas)
        d0_hours = await _fetch_hourly_for_date(tenant_id, f0, sucursal)
        d1_hours = await _fetch_hourly_for_date(tenant_id, f1, sucursal)
        d2_hours = await _fetch_hourly_for_date(tenant_id, f2, sucursal)

        filas = []
        tot_f0 = 0.0
        tot_f1 = 0.0
        tot_f2 = 0.0

        for h in range(8, 24):
            val0 = round(d0_hours.get(h, 0.0), 2)
            val1 = round(d1_hours.get(h, 0.0), 2)
            val2 = round(d2_hours.get(h, 0.0), 2)

            tot_f0 += val0
            tot_f1 += val1
            tot_f2 += val2

            filas.append({
                "hora": f"{h:02d}:00",
                "real": val0,
                "anio1": val1,
                "anio2": val2,
                "prediccion_ia": round(val1 * 1.05, 2) if val1 > 0 else 0.0
            })

        venta_pico = max([f["real"] for f in filas], default=0.0)
        hora_pico = next((f["hora"] for f in filas if f["real"] == venta_pico), "--:--")

        var_a1 = round(((tot_f0 - tot_f1) / tot_f1 * 100), 1) if tot_f1 > 0 else 0.0
        var_a2 = round(((tot_f0 - tot_f2) / tot_f2 * 100), 1) if tot_f2 > 0 else 0.0

        meta = {
            "total_real": round(tot_f0, 2),
            "total_a1": round(tot_f1, 2),
            "total_a2": round(tot_f2, 2),
            "docs_real": 0,
            "docs_a1": 0,
            "docs_a2": 0,
            "is_reference_a1": True,
            "f0_date": str(f0),
            "f1_date": str(f1),
            "f2_date": str(f2),
            "real_label": f"Actual ({f0.year})",
            "anio1_label": f"{f1.year} (Ref)",
            "anio2_label": f"{f2.year}",
            "holiday_name": "Día Estándar",
            "venta_promedio_horaria": round(tot_f0 / 16, 2),
            "venta_pico_maxima": venta_pico,
            "hora_pico": hora_pico,
            "margen_liquido": round(tot_f0 * 0.15, 2),
            "desempeno_yoy": var_a1,
            "variacion_vs_anio1": var_a1,
            "variacion_vs_anio2": var_a2,
        }

        return clean_nans({"horas": filas, "meta": meta})

    except Exception as e:
        print(f"Error en servicio multi-año: {e}")
        return {"horas": [], "meta": {}}
