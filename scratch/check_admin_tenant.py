import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    user = await db.users.find_one({"email": "admin@empresa.com"})
    if user:
        print(f"User tenant_id: {user.get('tenant_id')}")
    else:
        print("User not found.")

if __name__ == "__main__":
    asyncio.run(main())
