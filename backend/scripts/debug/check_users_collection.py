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
        plain_password = "Sucursal.heroinas$2026"

        count = await db["users"].count_documents({})
        print(f"Total users in 'users' collection: {count}")
        
        user = await db["users"].find_one({"email": email})
        if user:
            print(f"FOUND {email}!")
            hashed_password = user.get("hashed_password")
            if not hashed_password:
                print("No hashed password found for this user.")
            else:
                is_valid = pwd_context.verify(plain_password, hashed_password)
                if is_valid:
                    print("Password is CORRECT.")
                else:
                    print("Password DOES NOT MATCH.")
                    print("Updating password...")
                    new_hash = pwd_context.hash(plain_password)
                    await db["users"].update_one({"_id": user["_id"]}, {"$set": {"hashed_password": new_hash}})
                    print("Password updated successfully.")
        else:
            print(f"User {email} NOT FOUND in 'users' collection.")

    except Exception as e:
        print(f"Error connecting: {e}")

if __name__ == "__main__":
    asyncio.run(main())
