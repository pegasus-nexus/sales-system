import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import datetime

async def test_hist():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    start = datetime.datetime(2026, 8, 11, 0, 0, 0)
    end = datetime.datetime(2026, 8, 11, 23, 59, 59)
    
    docs = await db.ventas_historicas_crudas.count_documents({"fecha_transaccion": {"$gte": start, "$lte": end}})
    print(f"Historicos on 2026-08-11: {docs}")

if __name__ == '__main__':
    asyncio.run(test_hist())
