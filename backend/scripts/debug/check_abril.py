import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import datetime

async def main():
    uri = "mongodb+srv://sahian-dev-mongo:8wngkGRxGBKg3gsu@sales-system.hh277gd.mongodb.net/?appName=sales-system"
    db = AsyncIOMotorClient(uri)['salessystem']
    
    start_abril = datetime.datetime(2026, 4, 1)
    end_abril = datetime.datetime(2026, 4, 30, 23, 59, 59)
    
    count_abril = await db.ventas_historicas_crudas.count_documents({"fecha_transaccion": {"$gte": start_abril, "$lte": end_abril}})
    print(f'Total docs en Abril: {count_abril}')

asyncio.run(main())
