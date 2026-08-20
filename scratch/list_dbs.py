import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def list_dbs():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    dbs = await client.list_database_names()
    print("Bases de datos:")
    for db in dbs:
        print(f" - {db}")

if __name__ == '__main__':
    asyncio.run(list_dbs())
