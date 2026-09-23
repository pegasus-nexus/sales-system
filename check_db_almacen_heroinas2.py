import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    sucursal_id = "69cd80098f3f6866d4cfbb64" # Heroinas
    
    cursor = db.almacenes.find({
        "tenant_id": tenant_id,
        "sucursal_id": sucursal_id
    })
    
    almacenes = await cursor.to_list(length=100)
    print(f"Found {len(almacenes)} almacenes for Heroinas")
    for a in almacenes:
        print(f"Almacen: {a.get('nombre')} (ID: {a['_id']}) is_default: {a.get('is_default')}")

asyncio.run(get_db_info())
