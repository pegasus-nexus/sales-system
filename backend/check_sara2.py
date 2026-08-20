import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_clientes_real():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    users = await db.clientes.find({"nombre": {"$regex": "sara", "$options": "i"}}).to_list(100)
    print("CLIENTES:")
    for u in users:
        print(f"Name: {u.get('nombre')} | Phone: {u.get('telefono')} | Hash: {u.get('hashed_password')} | Member: {u.get('is_miembro_comunidad')} | Code: {u.get('numero_tarjeta')}")

if __name__ == '__main__':
    asyncio.run(check_clientes_real())
