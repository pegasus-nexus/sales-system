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
        "created_at": {"$gte": start_utc, "$lte": end_utc},
        "anulada": {"$ne": True}
    }).sort("created_at", 1).to_list(100)

    buckets = {}
    for d in docs:
        dt_utc = d.get("created_at")
        dt_bol = utc_to_bolivia(dt_utc) if dt_utc else None
        h = dt_bol.hour if dt_bol else 0
        tot = float(str(d.get("total", 0)))
        t_id = str(d["_id"])[-6:].upper()
        
        if h not in buckets:
            buckets[h] = {"total": 0.0, "tickets": []}
        buckets[h]["total"] += tot
        buckets[h]["tickets"].append((t_id, tot, dt_bol.strftime("%H:%M:%S")))

    print("=== MAPEO DE BUCKETS HORARIOS PARA AYER (20/08/2026) ===")
    for h in sorted(buckets.keys()):
        b = buckets[h]
        print(f"\nHora {h:02d}:00 (Total: Bs. {b['total']:.2f} | {len(b['tickets'])} tickets):")
        for t_id, tot, t_time in b["tickets"]:
            print(f"   - Ticket #{t_id} a las {t_time} -> Bs. {tot:.2f}")

asyncio.run(main())
