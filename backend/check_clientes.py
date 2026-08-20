import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_clientes():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    users = await db.clientes.find({"nombre_completo": {"$regex": "sara", "$options": "i"}}).to_list(100)
    print("CLIENTES:")
    for u in users:
        print(f"Name: {u.get('nombre_completo')} | Doc: {u.get('documento_identidad')} | Email: {u.get('email')} | Password: {u.get('password')} | Hash: {u.get('hashed_password')}")
        
    miembros = await db.miembros.find({"nombre": {"$regex": "sara", "$options": "i"}}).to_list(100)
    print("MIEMBROS:")
    for u in miembros:
        print(f"Name: {u.get('nombre')} | Email: {u.get('email')}")

if __name__ == '__main__':
    asyncio.run(check_clientes())
