import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    uri = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
    print("Conectando a MongoDB con certifi...")
    c = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
    dbs = await c.list_database_names()
    print("Bases de datos:", dbs)
    for db_name in dbs:
        cols = await c[db_name].list_collection_names()
        count = 0
        if "sales" in cols:
            count = await c[db_name]["sales"].count_documents({})
        print(f"  - DB {db_name}: {cols} | sales: {count}")

if __name__ == "__main__":
    asyncio.run(test())
