import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    cursor = db.inventario.find({"tenant_id": tenant_id})
    
    items = await cursor.to_list(length=1000)
    
    from bson.objectid import ObjectId
    ids = ["6aac195b231eec6c5b7bb12e", "6aac19c8231eec6c5b7bb132", "6aac1702231eec6c5b7bb119", "6aac18d8231eec6c5b7bb121", "6aac1918231eec6c5b7bb12c"]
    
    for pid in ids:
        prod = await db.products.find_one({"_id": ObjectId(pid)})
        if not prod: continue
        print(f"Product: {prod.get('descripcion')}")
        
        # Check ALL inventory documents in ALL branches to see if any has precio_sucursal
        invs = await db.inventario.find({"producto_id": pid}).to_list(length=100)
        for inv in invs:
            print(f"  Branch {inv.get('sucursal_id')} -> Precio: {inv.get('precio_sucursal')}")

asyncio.run(get_db_info())
