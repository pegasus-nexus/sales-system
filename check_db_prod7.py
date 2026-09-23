import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    sucursal_id = "69dfa560bb46ddb1ff3d5af2" # Supermercados
    
    count = await db.inventario.count_documents({
        "tenant_id": tenant_id,
        "sucursal_id": sucursal_id,
        "almacen_id": "default"
    })
    
    print(f"Total inventory items for Supermercados (default): {count}")

asyncio.run(get_db_info())
