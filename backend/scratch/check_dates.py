import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

async def main():
    mongo_uri = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "sales_system")
    client = AsyncIOMotorClient(mongo_uri)
    db = client[db_name]
    
    d1 = datetime(2026, 7, 18, 0, 0, 0, tzinfo=timezone.utc)
    d2 = datetime(2026, 7, 20, 23, 59, 59, tzinfo=timezone.utc)
    
    # Get distinct tenant_ids in that range
    tenant_ids = await db.sales.distinct("tenant_id", {"created_at": {"$gte": d1, "$lt": d2}})
    print(f"Tenant IDs in range: {tenant_ids}")
    
    # Check if there are any sales for tenant_id "69cd7f0a8f3f6866d4cfbb62" or whatever
    # Let's count sales for each tenant in this range
    for t_id in tenant_ids:
        cnt = await db.sales.count_documents({"created_at": {"$gte": d1, "$lt": d2}, "tenant_id": t_id})
        print(f"Tenant {t_id}: {cnt} sales")

if __name__ == "__main__":
    asyncio.run(main())
