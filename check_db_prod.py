import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant = await db.tenants.find_one({"name": {"$regex": "supermercado", "$options": "i"}})
    if not tenant:
        print("Tenant Supermercados not found, looking for others...")
        cursor = db.tenants.find()
        tenants = await cursor.to_list(length=10)
        for t in tenants:
            print(f"Tenant: {t.get('name')}")
        return
        
    print(f"Tenant: {tenant['name']} (ID: {tenant['_id']})")
    
    cursor = db.products.find({
        "tenant_id": str(tenant["_id"]),
        "name": {"$regex": "MARACUY", "$options": "i"}
    })
    
    products = await cursor.to_list(length=100)
    for p in products:
        print(f"Product: {p.get('name')} (ID: {p['_id']}) Active: {p.get('is_active')}")
        
        inv_cursor = db.inventory.find({
            "tenant_id": str(tenant["_id"]),
            "producto_id": str(p["_id"])
        })
        invs = await inv_cursor.to_list(length=100)
        for i in invs:
            print(f"  -> Inv: Sucursal: {i.get('sucursal_id')}, Almacen: {i.get('almacen_id')}, Cantidad: {i.get('cantidad')}")

asyncio.run(get_db_info())
