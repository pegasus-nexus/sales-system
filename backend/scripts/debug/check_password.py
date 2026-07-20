import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MONGO_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"

async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    users_collection = db["User"]

    email = "sucursal.heroinas.taboada@gmail.com"
    plain_password = "Sucursal.heroinas$2026"
    
    user = await users_collection.find_one({"email": email})
    if not user:
        print(f"User {email} NOT FOUND in production DB.")
        return
    
    print(f"User {email} found.")
    hashed_password = user.get("hashed_password")
    if not hashed_password:
        print("User has no hashed_password field!")
    else:
        is_valid = pwd_context.verify(plain_password, hashed_password)
        if is_valid:
            print("Password MATCHES perfectly. Issue must be something else.")
        else:
            print("Password DOES NOT match. Updating to the correct one...")
            new_hash = pwd_context.hash(plain_password)
            await users_collection.update_one({"_id": user["_id"]}, {"$set": {"hashed_password": new_hash}})
            print("Password updated successfully!")

if __name__ == "__main__":
    asyncio.run(main())
