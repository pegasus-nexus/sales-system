import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_comunidad():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    users = await db.comunidad_users.find({"nombre": {"$regex": "sara", "$options": "i"}}).to_list(100)
    print("COMUNIDAD USERS:")
    for u in users:
        print(f"Name: {u.get('nombre')} | Phone: {u.get('telefono')} | Email: {u.get('email')} | Password: {u.get('password')} | Hash: {u.get('hashed_password')}")
        
    users_all = await db.comunidad_users.find({}).to_list(10)
    print("\nSAMPLE COMUNIDAD USERS:")
    for u in users_all:
        print(f"Name: {u.get('nombre')} | Phone: {u.get('telefono')} | Email: {u.get('email')} | Password: {u.get('password')} | Hash: {u.get('hashed_password')}")

if __name__ == '__main__':
    asyncio.run(check_comunidad())
