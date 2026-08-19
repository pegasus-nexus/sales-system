import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import datetime

async def test_carnaval():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    start = datetime.datetime(2026, 2, 1, 0, 0, 0)
    end = datetime.datetime(2026, 3, 31, 23, 59, 59)
    
    docs = await db.ventas_historicas_crudas.count_documents({"fecha_transaccion": {"$gte": start, "$lte": end}})
    print(f"Docs in Feb/Mar 2026: {docs}")
    
    # Check if any have A1=2317.50? No, A1 would be 2025.
    
if __name__ == '__main__':
    asyncio.run(test_carnaval())
