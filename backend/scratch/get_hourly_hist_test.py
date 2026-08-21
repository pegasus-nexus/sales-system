import asyncio
import os
import sys
from datetime import date, datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def get_hourly_historico(d: date, sucursal_pattern: str):
    await init_db()
    db = await get_raw_db()

    start_dt = datetime(d.year, d.month, d.day, 0, 0, 0)
    end_dt = datetime(d.year, d.month, d.day, 23, 59, 59)

    pipeline = [
        {
            "$match": {
                "fecha_transaccion": {"$gte": start_dt, "$lte": end_dt},
                "sucursal": {"$regex": sucursal_pattern, "$options": "i"},
                "estado": {"$ne": "anulado"}
            }
        },
        {
            "$project": {
                "monto": {"$toDouble": "$monto_total_bs"},
                "hour": {"$hour": "$fecha_transaccion"}
            }
        },
        {
            "$match": {
                "monto": {"$gt": 0}
            }
        },
        {
            "$group": {
                "_id": "$hour",
                "total": {"$sum": "$monto"}
            }
        },
        {"$sort": {"_id": 1}}
    ]

    res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(100)
    hourly = {f"{r['_id']:02d}:00": round(float(r["total"]), 2) for r in res if r["_id"] is not None}
    total = sum(hourly.values())
    return hourly, total

async def main():
    h2025, tot2025 = await get_hourly_historico(date(2025, 8, 22), "Hero")
    h2024, tot2024 = await get_hourly_historico(date(2024, 8, 23), "Hero")

    print(f"--- 22/08/2025 (Heroínas) Total: Bs. {tot2025:.2f} ---")
    for h, v in h2025.items():
        print(f"  {h}: Bs. {v:>7.2f}")

    print(f"\n--- 23/08/2024 (Heroínas) Total: Bs. {tot2024:.2f} ---")
    for h, v in h2024.items():
        print(f"  {h}: Bs. {v:>7.2f}")

asyncio.run(main())
