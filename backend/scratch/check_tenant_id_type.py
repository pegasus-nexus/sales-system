import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db
from app.utils.date_utils import get_day_range_bolivia

async def main():
    await init_db()
    db = await get_raw_db()

    start_utc, end_utc = get_day_range_bolivia("2026-08-20")

    docs = await db.sales.find({
        "created_at": {"$gte": start_utc, "$lte": end_utc}
    }).to_list(10)

    print("=== SAMPLES FROM sales FOR 20/08/2026 ===")
    for d in docs:
        t_id = d.get("tenant_id")
        print(f"  ID: {d['_id']} | tenant_id: {t_id} (type: {type(t_id)}) | total: {d.get('total')}")

asyncio.run(main())
