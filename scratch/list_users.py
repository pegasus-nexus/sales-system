import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    async for u in db.users.find({}):
        print(f"User: {u.get('email', u.get('username'))} - Tenant: {u.get('tenant_id')} - Role: {u.get('role')}")

if __name__ == "__main__":
    asyncio.run(main())
