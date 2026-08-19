import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import datetime

async def search_day():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    # We will search the last 30 days in 'sales' collection
    now = datetime.datetime.now()
    
    for i in range(30):
        target = now - datetime.timedelta(days=i)
        start = target.replace(hour=0, minute=0, second=0) + datetime.timedelta(hours=4)
        end = target.replace(hour=23, minute=59, second=59) + datetime.timedelta(hours=4)
        
        pipeline = [
            {"$match": {
                "created_at": {"$gte": start, "$lte": end},
                "anulada": {"$ne": True},
                "estado": {"$ne": "anulado"}
            }},
            {"$group": {
                "_id": None,
                "total": {"$sum": {"$toDouble": "$total"}}
            }}
        ]
        
        res = await db.sales.aggregate(pipeline).to_list(1)
        if res:
            total = res[0]['total']
            if abs(total - 3849.50) < 5:
                print(f"FOUND DAY: {target.date()} with total {total}")
                
                # Check hours
                pipeline2 = [
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
                hours = await db.sales.aggregate(pipeline2).to_list(24)
                for h in hours:
                    print(f"{h['_id']:02d}:00 -> {h['total']}")
                return

if __name__ == '__main__':
    asyncio.run(search_day())
