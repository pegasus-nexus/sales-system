import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import datetime

async def print_today():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    start_utc = datetime.datetime(2026, 8, 18, 4, 0, 0)
    end_utc = datetime.datetime(2026, 8, 19, 3, 59, 59)
    
    cursor = db.sales.find({
        "created_at": {"$gte": start_utc, "$lte": end_utc},
    }).sort("created_at", 1)
    
    async for doc in cursor:
        print(f"created_at: {doc['created_at']} -> Bs. {doc.get('total')}")

if __name__ == '__main__':
    asyncio.run(print_today())
