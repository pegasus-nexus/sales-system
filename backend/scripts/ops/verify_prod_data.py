import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings

async def check():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client["sales_system_prod"]
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    # Check users
    user = await db["users"].find_one({"email": "admin.general.taboada@taboada.bo"})
    print(f"User tenant_id: {user.get('tenant_id') if user else 'NO USER'}")
    
    # Check categories
    cat_count = await db["category"].count_documents({"tenant_id": tenant_id})
    print(f"Categories for tenant {tenant_id}: {cat_count}")
    
    # Check all categories
    all_cats = await db["category"].count_documents({})
    print(f"Total categories in DB: {all_cats}")
    
    # Print distinct tenants in categories
    cats = await db["category"].find().to_list(None)
    tenants = set([c.get("tenant_id") for c in cats])
    print(f"Distinct tenants in categories: {tenants}")
    
asyncio.run(check())
