import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    from bson.objectid import ObjectId
    suc = await db.sucursales.find_one({"_id": ObjectId("69dfa560bb46ddb1ff3d5af2")})
    print(f"Sucursal Name: {suc.get('nombre') if suc else 'Not found'}")

asyncio.run(get_db_info())
