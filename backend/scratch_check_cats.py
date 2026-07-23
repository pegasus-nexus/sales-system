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
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    cats = await db["categories"].find({"tenant_id": tenant_id}).to_list(None)
    
    print("CATEGORIAS:")
    for c in cats:
        print(c.get("name"), c.get("is_active"))
        
if __name__ == "__main__":
    asyncio.run(main())
