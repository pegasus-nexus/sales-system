import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, Document

class TestDoc(Document):
    name: str

async def main():
    try:
        client = AsyncIOMotorClient("mongodb://user:password@localhost:27017")
        db = client["salessystem"]
        print("Testing with TestDoc...")
        await init_beanie(database=db, document_models=[TestDoc])
        print("✅ SUCCESS with simplest document")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
