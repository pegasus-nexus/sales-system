import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

async def main():
    client = AsyncIOMotorClient(os.getenv('MONGODB_URL'))
    db = client.get_default_database()
    
    print('--- TABLETA BLANCA C/FRUTILLAS ---')
    cursor = db.inventario.find({'descripcion': {'$regex': 'TABLETA BLANCA C/FRUTILLAS', '$options': 'i'}})
    async for doc in cursor:
        print(f"Sucursal: {doc.get('sucursal_id')}, Cantidad: {doc.get('cantidad')}")
        
    print('--- TABLETA SEMI AMARGO ---')
    cursor2 = db.inventario.find({'descripcion': {'$regex': 'TABLETA SEMI AMARGO SIN AZ', '$options': 'i'}})
    async for doc in cursor2:
        print(f"Sucursal: {doc.get('sucursal_id')}, Cantidad: {doc.get('cantidad')}")

asyncio.run(main())
