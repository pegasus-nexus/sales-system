import asyncio
import motor.motor_asyncio

async def run():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://127.0.0.1:27017')
    db = client.salessystem
    colls = await db.list_collection_names()
    for c in colls:
        count = await db[c].count_documents({})
        if count > 0:
            print(f"{c}: {count} docs")

asyncio.run(run())
