import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db
from app.utils.date_utils import get_day_range_bolivia, utc_to_bolivia

async def main():
    await init_db()
    db = await get_raw_db()
    
    start_utc, end_utc = get_day_range_bolivia("2026-08-21")
    docs = await db.sales.find({
        "created_at": {"$gte": start_utc, "$lte": end_utc}
    }).to_list(10)

    print("=== VENTAS DE HOY 21/08/2026 EN MONGODB ===")
    for d in docs:
        dt_utc = d.get("created_at")
        dt_bol = utc_to_bolivia(dt_utc) if dt_utc else None
        print(f"  Ticket: {d.get('_id')} | created_at UTC: {dt_utc} | Bolivia: {dt_bol} (Hora: {dt_bol.hour}:00) | total: {d.get('total')}")

asyncio.run(main())
