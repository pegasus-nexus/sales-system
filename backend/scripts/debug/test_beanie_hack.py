import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, Document

class ClientWrapper:
    def __init__(self, client):
        self._client = client
    def __getattr__(self, name):
        if name == "append_metadata":
            return lambda *args, **kwargs: None
        return getattr(self._client, name)

class BeanieFixWrapper:
    def __init__(self, db):
        self._db = db
    def __getattr__(self, name):
        if name == "client":
            return ClientWrapper(self._db.client)
        return getattr(self._db, name)

class TestDoc(Document):
    name: str

async def main():
    try:
        client = AsyncIOMotorClient("mongodb://user:password@localhost:27017")
        db = client["salessystem"]
        print("Testing with BeanieFixWrapper...")
        await init_beanie(database=BeanieFixWrapper(db), document_models=[TestDoc])
        print("✅ SUCCESS with BeanieFixWrapper hack!")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
