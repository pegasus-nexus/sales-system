import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"

async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    users_collection = db["User"]

    count = await users_collection.count_documents({})
    print(f"Total users in DB: {count}")
    
    cursor = users_collection.find({}, {"email": 1, "_id": 0})
    users = await cursor.to_list(length=100)
    for u in users:
        print(f" - {u.get('email')}")

if __name__ == "__main__":
    asyncio.run(main())
