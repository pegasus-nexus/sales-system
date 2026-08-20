import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_all():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_test?retryWrites=true&w=majority")
    db = client.sales_system_test
    
    users = await db.users.find({}).to_list(100)
    print("ALL USERS IN TEST DB:")
    for u in users:
        print(f"User: {u.get('username')} | Email: {u.get('email')} | Name: {u.get('full_name')} | Active: {u.get('is_active')}")

if __name__ == '__main__':
    asyncio.run(check_all())
