import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.salessystem
    print("Tenants in local database:")
    async for tenant in db.tenants.find():
        print(tenant)

asyncio.run(main())
