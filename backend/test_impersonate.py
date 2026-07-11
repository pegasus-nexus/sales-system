import asyncio
from beanie import init_beanie, PydanticObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from app.domain.models.user import User
from bson import ObjectId

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(database=client.salessystem, document_models=[User])
    user = await User.find_one({})
    if user:
        try:
            # Test getting with ObjectId
            u = await User.get(ObjectId(str(user.id)))
            print(f"Found with ObjectId: {u.username if u else None}")
        except Exception as e:
            print(f"Error with ObjectId: {e}")
            
        try:
            # Test getting with PydanticObjectId
            u2 = await User.get(PydanticObjectId(str(user.id)))
            print(f"Found with PydanticObjectId: {u2.username if u2 else None}")
        except Exception as e:
            print(f"Error with PydanticObjectId: {e}")

if __name__ == "__main__":
    asyncio.run(main())
