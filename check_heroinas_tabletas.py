import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    sucursal_id = "69cd80098f3f6866d4cfbb64" # Heroinas
    
    # Get all tabletas prices in Heroinas
    cursor = db.products.find({
        "tenant_id": tenant_id,
        "descripcion": {"$regex": "TABLETA CHOC", "$options": "i"}
    })
    
    items = await cursor.to_list(length=100)
    for p in items:
        inv = await db.inventario.find_one({"producto_id": str(p['_id']), "sucursal_id": sucursal_id})
        if inv and inv.get("precio_sucursal"):
            print(f"{p.get('descripcion')} -> {inv.get('precio_sucursal')}")

asyncio.run(get_db_info())
