import asyncio
from datetime import date
from motor.motor_asyncio import AsyncIOMotorClient

async def test_agg():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    # We will query yesterday's data
    import datetime
    target = datetime.datetime.now() - datetime.timedelta(days=1)
    d_str = target.strftime('%Y-%m-%d')
    start_utc = datetime.datetime.strptime(f"{d_str} 00:00:00", "%Y-%m-%d %H:%M:%S") + datetime.timedelta(hours=4)
    end_utc = datetime.datetime.strptime(f"{d_str} 23:59:59", "%Y-%m-%d %H:%M:%S") + datetime.timedelta(hours=4)
    
    pipeline = [
        { "$match": {
            "created_at": {"$gte": start_utc, "$lte": end_utc},
            "estado": {"$ne": "anulado"},
            "anulada": {"$ne": True}
        }},
        {
            "$project": {
                "monto_neto": {"$toDouble": "$total"},
                "created_at_utc": "$created_at",
                "hour_shifted": {"$hour": {"date": "$created_at", "timezone": "-04:00"}},
                "hour_raw": {"$hour": "$created_at"}
            }
        },
        {
            "$group": {
                "_id": "$hour_shifted",
                "total": {"$sum": "$monto_neto"},
                "sample_utc": {"$first": "$created_at_utc"},
                "sample_raw_hr": {"$first": "$hour_raw"}
            }
        },
        { "$sort": {"_id": 1} }
    ]
    
    res = await db.sales.aggregate(pipeline).to_list(100)
    for r in res:
        print(f"Shifted Hour (Bolivia): {r['_id']:02d}:00 | Total: {r['total']} | Sample UTC: {r['sample_utc']} | Raw Hour UTC: {r['sample_raw_hr']}")

if __name__ == '__main__':
    asyncio.run(test_agg())
