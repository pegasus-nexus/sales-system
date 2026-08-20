import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db():
    try:
        client = AsyncIOMotorClient('mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority')
        dbs = await client.list_database_names()
        print('Databases:', dbs)
        
        for db_name in dbs:
            if db_name in ['admin', 'local', 'config']:
                continue
            print(f'\nDatabase: {db_name}')
            db = client[db_name]
            collections = await db.list_collection_names()
            for col in collections:
                count = await db[col].count_documents({})
                print(f'  Collection {col} has {count} documents.')
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(check_db())
