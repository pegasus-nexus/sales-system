import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db
from app.infrastructure.repositories.mongo_analytics_repository import MongoAnalyticsRepository
from app.utils.date_utils import get_day_range_bolivia

async def test_superadmin_fallback():
    await init_db()
    repo = MongoAnalyticsRepository()
    
    start_dt, end_dt = get_day_range_bolivia("2026-08-20")

    # With tenant_id = None (Superadmin)
    tenant_id = None
    if not tenant_id or tenant_id == "None":
        tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    res = await repo.get_hourly_sales_distribution(tenant_id, start_dt, end_dt, None)
    tot = sum(r["total_ventas"] for r in res)
    print(f"Superadmin with fallback tenant_id: {len(res)} hours | Total: Bs. {tot:.2f}")

asyncio.run(test_superadmin_fallback())
