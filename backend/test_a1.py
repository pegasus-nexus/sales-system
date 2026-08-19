import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import datetime

async def test():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    start = datetime.datetime(2025, 8, 12, 0, 0, 0)
    end = datetime.datetime(2025, 8, 12, 23, 59, 59)
    
    pipeline = [
        {"$match": {
            "fecha_transaccion": {"$gte": start, "$lte": end},
            "estado": {"$ne": "anulado"}
        }},
        {"$project": {
            "hora": {"$hour": "$fecha_transaccion"},
            "monto": {"$toDouble": "$monto_total_bs"}
        }},
        {"$group": {
            "_id": "$hora",
            "total": {"$sum": "$monto"}
        }}
    ]
    
    res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(100)
    for r in res:
        print(f"Hora {r['_id']:02d}:00 -> {r['total']}")

if __name__ == '__main__':
    asyncio.run(test())
