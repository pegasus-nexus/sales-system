import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

NEW_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"

async def main():
    try:
        client = AsyncIOMotorClient(NEW_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        email = "sucursal.heroinas.taboada@gmail.com"
        user = await db["users"].find_one({"email": email})

        if user:
            print("REVERTING USER SUCURSAL ID TO ORIGINAL: 69cd80098f3f6866d4cfbb64")
            await db["users"].update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "tenant_id": "69cd7f0a8f3f6866d4cfbb62", 
                    "sucursal_id": "69cd80098f3f6866d4cfbb64"
                }}
            )
            print("User reverted successfully!")
        else:
            print("User not found.")

    except Exception as e:
        print(f"Error connecting: {e}")

if __name__ == "__main__":
    asyncio.run(main())
