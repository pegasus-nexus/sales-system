import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

NEW_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority"

async def main():
    try:
        client = AsyncIOMotorClient(NEW_URI, serverSelectionTimeoutMS=5000)
        dbs = await client.list_database_names()
        print("Databases in NEW cluster:", dbs)
        
        # Check specific databases
        for db_name in dbs:
            if db_name not in ["admin", "local", "config"]:
                db = client[db_name]
                cols = await db.list_collection_names()
                print(f" -> DB '{db_name}' has collections: {cols}")
                if "User" in cols:
                    count = await db["User"].count_documents({})
                    print(f"    Total users in '{db_name}': {count}")
                    
                    user = await db["User"].find_one({"email": "sucursal.heroinas.taboada@gmail.com"})
                    if user:
                        print(f"    FOUND sucursal.heroinas.taboada@gmail.com in {db_name}")

    except Exception as e:
        print(f"Error connecting: {e}")

if __name__ == "__main__":
    asyncio.run(main())
