import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.core.config import settings

async def check_cajeros():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    count = await db.users.count_documents({"role": "CAJERO"})
    print(f"Total CAJEROs: {count}")
    
    count_all = await db.users.count_documents({})
    print(f"Total users: {count_all}")
    
if __name__ == "__main__":
    asyncio.run(check_cajeros())
