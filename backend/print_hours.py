import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import datetime

async def print_hours():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    start = datetime.datetime(2026, 8, 11, 4, 0, 0)
    end = datetime.datetime(2026, 8, 12, 3, 59, 59)
    
    pipeline = [
        {"$match": {
            "created_at": {"$gte": start, "$lte": end},
            "anulada": {"$ne": True},
            "estado": {"$ne": "anulado"}
        }},
        {"$project": {
            "hour": {"$hour": {"date": "$created_at", "timezone": "-04:00"}},
            "total": {"$toDouble": "$total"}
        }},
        {"$group": {
            "_id": "$hour",
            "total": {"$sum": "$total"}
        }},
        {"$sort": {"_id": 1}}
    ]
    hours = await db.sales.aggregate(pipeline).to_list(24)
    total_all = 0
    for h in hours:
        print(f"Hora {h['_id']:02d}:00 -> {h['total']}")
        total_all += h['total']
    print(f"Total: {total_all}")

if __name__ == '__main__':
    asyncio.run(print_hours())
