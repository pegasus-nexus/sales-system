import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.core.config import settings

async def check_roles():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    roles = await db.users.distinct("role")
    print(f"Distinct roles in DB: {roles}")
    
if __name__ == "__main__":
    asyncio.run(check_roles())
