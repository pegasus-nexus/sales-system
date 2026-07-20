import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

NEW_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"

async def main():
    try:
        client = AsyncIOMotorClient(NEW_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        email = "sucursal.heroinas.taboada@gmail.com"
        plain_password = "Belen%2005"
        
        user = await db["users"].find_one({"email": email})
        if user:
            print("Updating password to Belen%2005...")
            new_hash = pwd_context.hash(plain_password)
            await db["users"].update_one({"_id": user["_id"]}, {"$set": {"hashed_password": new_hash}})
            print("Password updated to Belen%2005 successfully!")
        else:
            print(f"User {email} NOT FOUND.")

    except Exception as e:
        print(f"Error connecting: {e}")

if __name__ == "__main__":
    asyncio.run(main())
