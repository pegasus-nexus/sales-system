import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_users():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    users = await db.users.find({"email": {"$regex": "admin.general.taboada"}}).to_list(100)
    for u in users:
        print(f"User: {u.get('username')} | Email: {u.get('email')} | Role: {u.get('role')} | Active: {u.get('is_active')}")
        
    users2 = await db.users.find({"username": {"$regex": "admin.general"}}).to_list(100)
    for u in users2:
        print(f"User2: {u.get('username')} | Email: {u.get('email')} | Role: {u.get('role')} | Active: {u.get('is_active')}")

if __name__ == '__main__':
    asyncio.run(check_users())
