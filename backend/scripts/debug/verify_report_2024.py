import asyncio
import os
import sys
from datetime import datetime, time
import pytz
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.core.config import settings

async def verify_report_date():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    # We will test May 12, 2024
    tz = pytz.timezone("America/La_Paz")
    target_date_start = datetime(2024, 5, 1)
    target_date_end = datetime(2024, 5, 31)
    start_dt = tz.localize(datetime.combine(target_date_start, time.min))
    end_dt = tz.localize(datetime.combine(target_date_end, time.max))
    
    print(f"Testing Report Query for: {start_dt} to {end_dt}")
    
    pipeline = [
        {"$match": {"created_at": {"$gte": start_dt, "$lte": end_dt}}},
        {"$project": {"dateStr": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}}},
        {"$group": {"_id": "$dateStr", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    
    results = await db.sales.aggregate(pipeline).to_list(length=None)
    
    print(f"Days with sales in May 2024:")
    for r in results:
        print(f" - {r['_id']}: {r['count']} sales")

if __name__ == "__main__":
    asyncio.run(verify_report_date())
