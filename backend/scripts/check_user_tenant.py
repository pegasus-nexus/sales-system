import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    users = await db["users"].find().to_list(None)
    for u in users:
        print(f"User: {u.get('email')} -> tenant: {u.get('tenant_id')}")

if __name__ == "__main__":
    asyncio.run(run())
