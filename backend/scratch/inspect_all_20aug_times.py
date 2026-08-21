import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db
from app.utils.date_utils import get_day_range_bolivia, utc_to_bolivia

async def main():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    start_utc, end_utc = get_day_range_bolivia("2026-08-20")

    docs = await db.sales.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc, "$lte": end_utc}
    }).sort("created_at", 1).to_list(100)

    print(f"Total docs para 20/08/2026: {len(docs)}")
    print(f"{'ID (ultimos 6)':<15} | {'Total':<10} | {'created_at UTC BSON':<30} | {'utc_to_bolivia()':<30}")
    print("-" * 95)

    for d in docs:
        dt_utc = d.get("created_at")
        dt_bol = utc_to_bolivia(dt_utc) if dt_utc else None
        tot = float(str(d.get("total", 0)))
        short_id = str(d["_id"])[-6:].upper()
        print(f"Ticket #{short_id:<8} | {tot:>10.2f} | {str(dt_utc):<30} | {str(dt_bol):<30}")

asyncio.run(main())
