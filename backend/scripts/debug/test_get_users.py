import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.core.config import settings
from app.domain.models.user import User, UserRole
from app.api.v1.endpoints.users import format_user_response
from beanie.operators import In
from beanie import init_beanie

async def test_get_users():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    await init_beanie(database=db, document_models=[User])
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    staff_roles = [UserRole.CAJERO, UserRole.VENDEDOR, UserRole.ADMIN_SUCURSAL, UserRole.FACTURADOR]
    
    users = await User.find(
        User.tenant_id == tenant_id,
        In(User.role, staff_roles),
    ).to_list()
    
    print(f"Found {len(users)} users for tenant {tenant_id}")
    
    for u in users:
        try:
            resp = format_user_response(u)
        except Exception as e:
            print(f"Error formatting user {u.id}: {e}")
            raise e
            
    print("Formatting successful for all users.")

if __name__ == "__main__":
    asyncio.run(test_get_users())
