import asyncio
import urllib.parse
from motor.motor_asyncio import AsyncIOMotorClient

username = "rodrigorayomartinez_db_user"
password = "x98J2#M1n$zQ0pL5!bV4*kX2vC%xZ"
encoded_password = urllib.parse.quote_plus(password)

OLD_URI = f"mongodb+srv://{username}:{encoded_password}@cluster0.teutv4o.mongodb.net/?appName=Cluster0"

async def main():
    try:
        client = AsyncIOMotorClient(OLD_URI, serverSelectionTimeoutMS=5000)
        dbs = await client.list_database_names()
        print("Databases in old cluster:", dbs)
        
        # Check specific databases
        for db_name in dbs:
            if db_name not in ["admin", "local", "config"]:
                db = client[db_name]
                cols = await db.list_collection_names()
                print(f" -> DB '{db_name}' has collections: {cols}")
                if "User" in cols:
                    count = await db["User"].count_documents({})
                    print(f"    Total users in '{db_name}': {count}")

    except Exception as e:
        print(f"Error connecting: {e}")

if __name__ == "__main__":
    asyncio.run(main())
