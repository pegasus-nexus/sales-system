import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    uri = 'mongodb+srv://rodrigorayomartinez_db_user:RqunkSiTBxQU2oew@cluster0.teutv4o.mongodb.net/?appName=Cluster0'
    client = AsyncIOMotorClient(uri)
    try:
        dbs = await client.list_database_names()
        print('Databases:', dbs)
        for db_name in dbs:
            if db_name in ['admin', 'local', 'config']:
                continue
            print(f'\n--- DB: {db_name} ---')
            db = client[db_name]
            collections = await db.list_collection_names()
            for col in collections:
                count = await db[col].count_documents({})
                print(f'{col}: {count}')
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    asyncio.run(main())
