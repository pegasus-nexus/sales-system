import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    sucursal_id = "69cd80098f3f6866d4cfbb64" # Heroinas
    producto_id = "69cd81b68f3f6866d4cfbc6f" # MARACUYA SEMIDULCE
    
    cursor = db.inventario.find({
        "tenant_id": tenant_id,
        "sucursal_id": sucursal_id,
        "producto_id": producto_id
    })
    
    items = await cursor.to_list(length=10)
    for i in items:
        print(f"Inv ID: {i['_id']}, Almacen: {i.get('almacen_id')}, Cant: {i.get('cantidad')}, Updated: {i.get('updated_at')}")

asyncio.run(get_db_info())
