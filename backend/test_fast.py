import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import datetime

async def test():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    # We want to find a day and sucursal where the shifted sum (or unshifted sum) is exactly 3849.50
    # Let's just group by day and sucursal_id in sales collection
    
    pipeline = [
        {"$match": {
            "estado": {"$ne": "anulado"},
            "anulada": {"$ne": True},
            "created_at": {"$gte": datetime.datetime(2026, 1, 1)}
        }},
        {"$project": {
            "day": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at", "timezone": "-04:00"}},
            "sucursal_id": 1,
            "total": {"$toDouble": "$total"}
        }},
        {"$group": {
            "_id": {"day": "$day", "suc": "$sucursal_id"},
            "total_local": {"$sum": "$total"}
        }}
    ]
    
    res = await db.sales.aggregate(pipeline).to_list(1000)
    for r in res:
        if abs(r['total_local'] - 3849.50) < 10:
            print(f"Match Local: {r['_id']} -> {r['total_local']}")

    # What if it's shifted?
    pipeline_shifted = [
        {"$match": {
            "estado": {"$ne": "anulado"},
            "anulada": {"$ne": True},
            "created_at": {"$gte": datetime.datetime(2026, 1, 1)}
        }},
        {"$project": {
            # Grouping by UTC day to see if that matches
            "day": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "sucursal_id": 1,
            "total": {"$toDouble": "$total"}
        }},
        {"$group": {
            "_id": {"day": "$day", "suc": "$sucursal_id"},
            "total_utc": {"$sum": "$total"}
        }}
    ]
    res2 = await db.sales.aggregate(pipeline_shifted).to_list(1000)
    for r in res2:
        if abs(r['total_utc'] - 3849.50) < 10:
            print(f"Match UTC: {r['_id']} -> {r['total_utc']}")

if __name__ == '__main__':
    asyncio.run(test())
