import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import date, datetime
import pandas as pd

async def test_tz_fix():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    target_date = date(2026, 4, 3)

    # 1. Rango Naive anterior (00:00 a 23:59 UTC)
    start_old = datetime.combine(target_date, datetime.min.time())
    end_old = datetime.combine(target_date, datetime.max.time())
    cnt_old = await db.sales.count_documents({
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_old, "$lte": end_old},
        "anulada": {"$ne": True}
    })

    # 2. Rango con conversión de huso horario Bolivia (UTC-4)
    start_local = pd.Timestamp(target_date, tz="America/La_Paz")
    end_local = start_local + pd.Timedelta(days=1)
    start_utc = start_local.tz_convert("UTC").to_pydatetime()
    end_utc = end_local.tz_convert("UTC").to_pydatetime()

    cnt_new = await db.sales.count_documents({
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc, "$lt": end_utc},
        "anulada": {"$ne": True}
    })

    print(f"Rango Naive Anterior ({start_old} a {end_old}): {cnt_old} ventas")
    print(f"Rango UTC Bolivia ({start_utc} a {end_utc}): {cnt_new} ventas")

    # Ejecutar pipeline de agregación con rango UTC Bolivia
    tz_offset_ms = -4 * 3600 * 1000
    pipeline = [
        {"$match": {
            "tenant_id": tenant_id,
            "created_at": {"$gte": start_utc, "$lt": end_utc},
            "anulada": {"$ne": True}
        }},
        {
            "$group": {
                "_id": {
                    "$hour": {
                        "$dateAdd": {
                            "startDate": "$created_at",
                            "unit": "millisecond",
                            "amount": tz_offset_ms
                        }
                    }
                },
                "total": {"$sum": "$total"}
            }
        }
    ]

    res = await db.sales.aggregate(pipeline).to_list(100)
    print("\nDesglose por Hora Local Bolivia (2026-04-03):")
    total_day = 0.0
    for r in sorted(res, key=lambda x: x["_id"] if x["_id"] is not None else -1):
        v = float(str(r["total"]))
        total_day += v
        print(f"  {r['_id']:02d}:00 -> Bs. {v:,.2f}")

    print(f"\nTOTAL DEL DÍA 03/04/2026 (BOLIVIA TIME): Bs. {total_day:,.2f}")

if __name__ == '__main__':
    asyncio.run(test_tz_fix())
