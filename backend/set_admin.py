import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pathlib import Path
import sys

# Setup Path
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.append(str(current_dir))

from app.core.config import settings

def get_password_hash(password: str) -> str:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(password)

async def set_admin_password():
    # Try settings first, fallback to no-auth local if fails
    try:
        MONGODB_URL = settings.MONGODB_URL
        client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=2000)
        await client.admin.command('ping')
    except:
        MONGODB_URL = "mongodb://localhost:27017"
        client = AsyncIOMotorClient(MONGODB_URL)
        
    db = client["salessystem"]
    hashed_password = get_password_hash("admin123")
    
    result = await db["users"].update_one(
        {"username": "admin"},
        {"$set": {"hashed_password": hashed_password}}
    )
    
    if result.modified_count > 0:
        print("✅ Password for 'admin' set to: admin123")
    else:
        print("❌ Could not find user 'admin' to update.")

if __name__ == "__main__":
    asyncio.run(set_admin_password())
