import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime, timezone
import pandas as pd

async def audit_created_at_field():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    ts_2026 = pd.Timestamp("2026-08-10", tz="America/La_Paz")
    start_utc = ts_2026.tz_convert("UTC").to_pydatetime()
    end_utc = (ts_2026 + pd.Timedelta(days=1)).tz_convert("UTC").to_pydatetime()

    # Query 1: Find 5 sample documents from 10-08-2026
    sample_sales = await db.sales.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc, "$lt": end_utc}
    }).to_list(10)

    print("==========================================================================")
    print("AUDITORÍA FORENSE DE CAMPO created_at EN MONGODB 'sales':")
    print("==========================================================================")
    for s in sample_sales:
        ca = s.get("created_at")
        print(f"ID: {s['_id']} | Type: {type(ca)} | Value: {repr(ca)}")
        if isinstance(ca, datetime):
            print(f"  -> tzinfo: {ca.tzinfo} | is_naive: {ca.tzinfo is None}")

    # Query 2: Test Mongo Aggregation $hour with $subtract (offset ms)
    # Note: If created_at is stored in UTC (e.g. 13:01 UTC), subtract -4 hours (-14,400,000 ms) BEFORE $hour:
    # 13:01 UTC - 4h = 09:01 Local -> $hour = 9!
    pipeline_subtract_first = [
        {
            "$match": {
                "tenant_id": tenant_id,
                "created_at": {"$gte": start_utc, "$lt": end_utc},
                "anulada": {"$ne": True}
            }
        },
        {
            "$project": {
                "created_at": 1,
                "local_date": {
                    "$dateSubtract": {
                        "startDate": "$created_at",
                        "unit": "hour",
                        "amount": 4
                    }
                },
                "monto": {"$toDouble": "$total"}
            }
        },
        {
            "$project": {
                "created_at": 1,
                "local_date": 1,
                "hora_local": {"$hour": "$local_date"},
                "monto": 1
            }
        },
        {
            "$group": {
                "_id": "$hora_local",
                "total": {"$sum": "$monto"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]

    res_sub = await db.sales.aggregate(pipeline_subtract_first).to_list(100)
    print("\n==========================================================================")
    print("RESULTADO AGGREGATION CON $dateSubtract (amount: 4 hours):")
    print("==========================================================================")
    for r in res_sub:
        print(f"  • Hora Local {r['_id']:02d}:00 -> Total: Bs. {r['total']:>8,.2f} | Docs: {r['count']}")

if __name__ == '__main__':
    asyncio.run(audit_created_at_field())
