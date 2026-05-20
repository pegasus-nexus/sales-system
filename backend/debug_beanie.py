import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User

async def main():
    try:
        client = AsyncIOMotorClient("mongodb://user:password@localhost:27017")
        db = client.get_database("salessystem")
        print("Connected to:", db.name)
        await init_beanie(database=db, document_models=[User])
        print("Success with get_database")
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
