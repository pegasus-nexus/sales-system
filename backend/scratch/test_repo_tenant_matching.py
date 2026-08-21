import asyncio
import os
import sys
from datetime import date
from bson import ObjectId

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db
from app.infrastructure.repositories.mongo_analytics_repository import MongoAnalyticsRepository
from app.utils.date_utils import get_day_range_bolivia

async def test_repo_tenant_matching():
    await init_db()
    repo = MongoAnalyticsRepository()

    d = date(2026, 8, 20)
    start_dt, end_dt = get_day_range_bolivia("2026-08-20")

    # Test 1: string tenant_id
    res1 = await repo.get_hourly_sales_distribution("69cd7f0a8f3f6866d4cfbb62", start_dt, end_dt, None)
    tot1 = sum(r["total_ventas"] for r in res1)
    print(f"Test 1 (string tenant_id '69cd7f0a8f3f6866d4cfbb62'): {len(res1)} hours | Total: Bs. {tot1:.2f}")

    # Test 2: ObjectId tenant_id string vs actual
    db = await get_raw_db()
    sales_sample = await db.sales.find_one({"created_at": {"$gte": start_dt, "$lte": end_dt}})
    if sales_sample:
        actual_t_id = sales_sample.get("tenant_id")
        print(f"Actual tenant_id in document: {actual_t_id} (type: {type(actual_t_id)})")
        res2 = await repo.get_hourly_sales_distribution(str(actual_t_id), start_dt, end_dt, None)
        tot2 = sum(r["total_ventas"] for r in res2)
        print(f"Test 2 (actual tenant_id): {len(res2)} hours | Total: Bs. {tot2:.2f}")

asyncio.run(test_repo_tenant_matching())
