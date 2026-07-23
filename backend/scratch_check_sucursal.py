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
    sucursales = await db["sucursales"].find({"tenant_id": "69cd7f0a8f3f6866d4cfbb62"}).to_list(None)
    print(f"Found {len(sucursales)} sucursales for Chocolates Taboada")
    for s in sucursales:
        print(f"ID: {s.get('_id')}, Name: {s.get('nombre')}, Ciudad: {s.get('ciudad')}")
        
if __name__ == "__main__":
    asyncio.run(main())
