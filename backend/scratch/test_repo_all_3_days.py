import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.infrastructure.repositories.mongo_analytics_repository import MongoAnalyticsRepository
from app.utils.date_utils import get_day_range_bolivia

async def test_day(date_str: str):
    await init_db()
    repo = MongoAnalyticsRepository()
    
    start_dt, end_dt = get_day_range_bolivia(date_str)
    dist = await repo.get_hourly_sales_distribution("69cd7f0a8f3f6866d4cfbb62", start_dt, end_dt, None)

    print(f"\n=======================================================")
    print(f"REPOSITORIO get_hourly_sales_distribution PARA {date_str}:")
    print(f"Total horas con ventas: {len(dist)}")
    total_val = sum(h["total_ventas"] for h in dist)
    print(f"Suma Total Válida: Bs. {total_val:.2f}")
    print("-------------------------------------------------------")
    for h in dist:
        print(f"  Hora {h['_id']:02d}:00 -> Bs. {h['total_ventas']:.2f} ({h['cantidad_ventas']} ventas)")

async def main():
    await test_day("2026-08-19")
    await test_day("2026-08-20")
    await test_day("2026-08-21")

asyncio.run(main())
