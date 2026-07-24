import asyncio
from datetime import datetime, timezone
import sys
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    start = datetime(2026, 6, 1, tzinfo=timezone.utc)
    end = datetime(2026, 6, 30, 23, 59, 59, tzinfo=timezone.utc)
    
    print("Checking sucursal names in ventas_historicas_crudas for June...")
    pipeline = [
        {"$match": {"fecha_transaccion": {"$gte": start, "$lte": end}}},
        {"$group": {"_id": "$sucursal", "count": {"$sum": 1}}}
    ]
    cursor = db["ventas_historicas_crudas"].aggregate(pipeline)
    async for doc in cursor:
        print(doc)

if __name__ == "__main__":
    asyncio.run(run())
