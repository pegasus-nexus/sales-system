import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime, timezone

async def test_utc_range():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    # Si se consulta el 10-08-2026 de 00:00:00 UTC a 23:59:59 UTC (SIN restar las 4 horas de Bolivia):
    utc_start = datetime(2026, 8, 10, 0, 0, 0, tzinfo=timezone.utc)
    utc_end = datetime(2026, 8, 10, 23, 59, 59, tzinfo=timezone.utc)

    sales_utc = await db.sales.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": utc_start, "$lte": utc_end},
        "anulada": {"$ne": True}
    }).to_list(1000)

    total_utc = sum(float(str(s.get("total", 0))) for s in sales_utc)
    print("==========================================================================")
    print("PROBANDO SI EL CLIENTE O EL BACKEND USÓ EL RANGO UTC DIRECTO (SIN CONVERSIÓN BOLIVIA):")
    print("==========================================================================")
    print(f"Rango 2026-08-10 00:00:00 UTC a 23:59:59 UTC -> Docs: {len(sales_utc)} | Total: Bs. {total_utc:,.2f}")

    # Chequear el desglose por hora en UTC sin restar 4h:
    from collections import defaultdict
    by_hour_utc = defaultdict(lambda: {"total": 0.0, "count": 0})
    for s in sales_utc:
        h = s["created_at"].hour
        by_hour_utc[h]["total"] += float(str(s.get("total", 0)))
        by_hour_utc[h]["count"] += 1

    print("\nDesglose por Hora UTC pura:")
    for h in sorted(by_hour_utc.keys()):
        print(f"  Hora UTC {h:02d}:00 -> Total: Bs. {by_hour_utc[h]['total']:>8,.2f} | Docs: {by_hour_utc[h]['count']}")

if __name__ == '__main__':
    asyncio.run(test_utc_range())
