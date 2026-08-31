import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority"

async def main():
    client = AsyncIOMotorClient(MONGO_URL)

    tenant = "69cd7f0a8f3f6866d4cfbb62"

    filtro = {
        "tenant_id": tenant,
        "created_at": {
            "$gte": datetime(2026, 8, 27, 4, 0, 0),
            "$lte": datetime(2026, 8, 28, 3, 59, 59, 999000)
        },
        "anulada": {"$ne": True}
    }

    prod = await client["sales_system_prod"].sales.count_documents(filtro)
    dev = await client["sales_system_dev"].sales.count_documents(filtro)

    print("sales_system_prod:", prod)
    print("sales_system_dev :", dev)

    client.close()

asyncio.run(main())