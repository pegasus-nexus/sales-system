import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.salessystem
    print("Users in local database:")
    async for user in db.users.find():
        print(user)

asyncio.run(main())
