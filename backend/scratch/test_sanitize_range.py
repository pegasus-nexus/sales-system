import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.infrastructure.repositories.mongo_analytics_repository import MongoAnalyticsRepository
from app.utils.date_utils import get_day_range_bolivia, get_range_bolivia

async def main():
    await init_db()
    repo = MongoAnalyticsRepository()

    # Frontend sends ISO string parsed by FastAPI as 2026-08-20 00:00:00 UTC to 2026-08-20 23:59:59 UTC
    dt_start_naive = datetime(2026, 8, 20, 0, 0, 0)
    dt_end_naive = datetime(2026, 8, 20, 23, 59, 59)

    # 1. Unsanitized query
    dist1 = await repo.get_hourly_sales_distribution("69cd7f0a8f3f6866d4cfbb62", dt_start_naive, dt_end_naive, None)
    tot1 = sum(h["total_ventas"] for h in dist1)
    print(f"Sin sanitize (2026-08-20 00:00 a 23:59 UTC): {len(dist1)} horas | Total: Bs. {tot1:.2f}")

    # 2. Sanitized query with get_range_bolivia
    s_utc, e_utc = get_range_bolivia("2026-08-20", "2026-08-20")
    dist2 = await repo.get_hourly_sales_distribution("69cd7f0a8f3f6866d4cfbb62", s_utc, e_utc, None)
    tot2 = sum(h["total_ventas"] for h in dist2)
    print(f"Con sanitize (Bolivia 00:00 a 23:59 -> UTC 04:00 a 03:59+1d): {len(dist2)} horas | Total: Bs. {tot2:.2f}")
    print("Horas encontradas en sanitized:")
    for h in dist2:
        print(f"  Hora {h['_id']:02d}:00 -> Bs. {h['total_ventas']:.2f}")

asyncio.run(main())
