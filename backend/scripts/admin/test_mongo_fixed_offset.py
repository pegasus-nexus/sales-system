import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
import pandas as pd

async def test_fixed_offset():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    ts_2026 = pd.Timestamp("2026-08-10", tz="America/La_Paz")
    start_utc = ts_2026.tz_convert("UTC").to_pydatetime()
    end_utc = (ts_2026 + pd.Timedelta(days=1)).tz_convert("UTC").to_pydatetime()

    # Test 1: $hour with timezone: "-04:00"
    pipeline_fixed = [
        {
            "$match": {
                "tenant_id": tenant_id,
                "created_at": {"$gte": start_utc, "$lt": end_utc},
                "anulada": {"$ne": True}
            }
        },
        {
            "$project": {
                "hora": {"$hour": {"date": "$created_at", "timezone": "-04:00"}},
                "total": {"$toDouble": "$total"}
            }
        },
        {
            "$group": {
                "_id": "$hora",
                "total": {"$sum": "$total"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]

    res_fixed = await db.sales.aggregate(pipeline_fixed).to_list(100)

    print("==========================================================================")
    print("RESULTADO DE $hour CON timezone='-04:00':")
    print("==========================================================================")
    for r in res_fixed:
        print(f"  • Hora Local Bolivia {r['_id']:02d}:00 -> Total: Bs. {r['total']:>8,.2f} | Docs: {r['count']}")

if __name__ == '__main__':
    asyncio.run(test_fixed_offset())
