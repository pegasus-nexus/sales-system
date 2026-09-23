import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    sucursal_id = "69dfa560bb46ddb1ff3d5af2" # Supermercados
    
    cursor = db.products.find({
        "tenant_id": tenant_id,
        "descripcion": {"$regex": "MARACUY", "$options": "i"}
    })
    
    products = await cursor.to_list(length=100)
    for p in products:
        print(f"\nProduct: {p.get('descripcion')} (ID: {p['_id']}) Active: {p.get('is_active')}")
        
        inv_cursor = db.inventory.find({
            "tenant_id": tenant_id,
            "producto_id": str(p["_id"])
        })
        invs = await inv_cursor.to_list(length=100)
        for i in invs:
            if i.get('sucursal_id') == sucursal_id or True: # Print all
                print(f"  -> Inv: Suc: {i.get('sucursal_id')}, Almacen: {i.get('almacen_id')}, Cantidad: {i.get('cantidad')}")

asyncio.run(get_db_info())
