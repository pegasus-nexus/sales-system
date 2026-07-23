import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
db_name = os.getenv("MONGODB_DB_NAME", "chocosys_db")

async def main():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    tenants = await db["tenants"].find().to_list(None)
    for t in tenants:
        print(f"ID: {t.get('_id')}, Name: {t.get('name')}")
        
if __name__ == "__main__":
    asyncio.run(main())
