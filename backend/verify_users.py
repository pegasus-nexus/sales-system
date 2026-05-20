import asyncio
import sys
from pathlib import Path

# Setup Path
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.append(str(current_dir))

from app.core.config import settings
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client["salessystem"]
    users = await db.users.find().to_list(None)
    for u in users:
        print(u)
    if not users:
        print("No users found.")

    # Create admin user just in case
    from set_admin import get_password_hash
    from datetime import datetime
    pwd = get_password_hash("admin123")
    
    admin_exists = any(u.get("username") == "admin" for u in users)
    if not admin_exists:
        await db.users.insert_one({
            "tenant_id": "test-taboada",
            "username": "admin",
            "full_name": "Administrador Taboada",
            "email": "admin@taboada.com",
            "role": "SUPERADMIN",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "hashed_password": pwd
        })
        print("Admin user created with username: admin, password: admin123")
    else:
        # update it
        await db.users.update_one({"username": "admin"}, {"$set": {"hashed_password": pwd}})
        print("Admin user updated with password: admin123")

if __name__ == "__main__":
    asyncio.run(run())
