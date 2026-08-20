import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
from motor.motor_asyncio import AsyncIOMotorClient
from app.auth import get_password_hash, verify_password

async def test_login():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    
    user = await db.users.find_one({"username": "jhesica.bohorquez.peredo"})
    if not user:
        print("User NOT FOUND in prod")
        return
    
    print("User found!")
    print(f"Role: {user['role']}")
    print(f"Is Active: {user['is_active']}")
    
    password = "Jhes12boh90per%6213"
    valid = verify_password(password, user['hashed_password'])
    print(f"Password Valid: {valid}")

if __name__ == '__main__':
    asyncio.run(test_login())
