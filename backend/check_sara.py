import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import re

async def check_sara():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    users = await db.users.find({"full_name": {"$regex": "sara", "$options": "i"}}).to_list(100)
    for u in users:
        print(f"User: {u.get('username')} | Email: {u.get('email')} | Name: {u.get('full_name')} | Active: {u.get('is_active')} | Hash: {u.get('hashed_password')[:15]}...")

if __name__ == '__main__':
    asyncio.run(check_sara())
