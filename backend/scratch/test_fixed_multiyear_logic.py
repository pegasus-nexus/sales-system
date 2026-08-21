import asyncio
import os
import sys
from datetime import date, datetime
from typing import Dict, Any

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db
from app.infrastructure.repositories.mongo_analytics_repository import MongoAnalyticsRepository
from app.utils.date_utils import get_day_range_bolivia

async def fetch_hourly_clean(tenant_id: str, d: date, sucursal: str = None) -> Dict[int, float]:
    # Si el año es 2026, consultar ventas en vivo de POS (db.sales)
    if d.year >= 2026:
        repo = MongoAnalyticsRepository()
        start_dt, end_dt = get_day_range_bolivia(d.strftime("%Y-%m-%d"))
        dist = await repo.get_hourly_sales_distribution(tenant_id, start_dt, end_dt, sucursal)
        return {h["_id"]: float(h.get("total_ventas", 0)) for h in dist if h["_id"] is not None}

    # Para años anteriores (2025, 2024, etc.), consultar siempre la colección histórica real (db.ventas_historicas_crudas)
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

async def main():
    await init_db()
    
    f0 = date(2026, 8, 20)
    f1 = date(2025, 8, 21)
    f2 = date(2024, 8, 22)

    for suc in ["all", "Heroinas", "Recoleta", "Calacoto"]:
        h0 = await fetch_hourly_clean("69cd7f0a8f3f6866d4cfbb62", f0, suc)
        h1 = await fetch_hourly_clean("69cd7f0a8f3f6866d4cfbb62", f1, suc)
        h2 = await fetch_hourly_clean("69cd7f0a8f3f6866d4cfbb62", f2, suc)

        t0 = sum(h0.values())
        t1 = sum(h1.values())
        t2 = sum(h2.values())

        print(f"\n=======================================================")
        print(f"SUCURSAL: {suc.upper()}")
        print(f"Total 20/08/2026: Bs. {t0:.2f} | Total 21/08/2025: Bs. {t1:.2f} | Total 22/08/2024: Bs. {t2:.2f}")
        print("-------------------------------------------------------")
        print(f"{'Hora':<7} | {'20/08/2026 (Ayer)':<18} | {'21/08/2025 (-1 yr)':<18} | {'22/08/2024 (-2 yr)':<18}")
        print("-------------------------------------------------------")
        for h in range(8, 24):
            val0 = h0.get(h, 0.0)
            val1 = h1.get(h, 0.0)
            val2 = h2.get(h, 0.0)
            if val0 > 0 or val1 > 0 or val2 > 0:
                print(f"{h:02d}:00   | Bs. {val0:>14.2f} | Bs. {val1:>14.2f} | Bs. {val2:>14.2f}")

asyncio.run(main())
