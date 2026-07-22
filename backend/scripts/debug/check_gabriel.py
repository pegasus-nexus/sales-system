import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_ninoska():
    uri = "mongodb+srv://sahian-dev-mongo:8wngkGRxGBKg3gsu@sales-system.hh277gd.mongodb.net/?appName=sales-system"
    client = AsyncIOMotorClient(uri)
    db = client.salessystem
    
    ninoska = await db.users.find_one({"username": "ninoska.cori.amaru"})
    if ninoska:
        print(f"Ninoska found: role={ninoska.get('role')}, sucursal_id={ninoska.get('sucursal_id')}")
        sucursal = await db.sucursales.find_one({"_id": ninoska.get('sucursal_id')})
        if sucursal:
            print(f"Sucursal: {sucursal.get('nombre')} (tipo: {sucursal.get('tipo')})")

if __name__ == "__main__":
    asyncio.run(check_ninoska())
