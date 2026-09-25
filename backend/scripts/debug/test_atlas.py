import asyncio
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    uri = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority"
    print("Conectando a MongoDB Atlas con certifi...")
    c = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
    dbs = await c.list_database_names()
    print("Bases de datos en Atlas:", dbs)
    for db_name in dbs:
        cols = await c[db_name].list_collection_names()
        count = 0
        if "sales" in cols:
            count = await c[db_name]["sales"].count_documents({})
        print(f"  - DB {db_name}: {cols} | sales: {count}")

if __name__ == "__main__":
    asyncio.run(test())
