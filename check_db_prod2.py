import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant = await db.tenants.find_one({"name": {"$regex": "Taboada", "$options": "i"}})
    if not tenant:
        print("Tenant Taboada not found")
        return
        
    print(f"Tenant: {tenant['name']} (ID: {tenant['_id']})")
    
    # Let's list branches
    cursor = db.sucursales.find({"tenant_id": str(tenant["_id"])})
    branches = await cursor.to_list(length=20)
    for b in branches:
        print(f"Sucursal: {b.get('nombre')} (ID: {b['_id']})")
    
    cursor = db.products.find({
        "tenant_id": str(tenant["_id"]),
        "name": {"$regex": "MARACUY", "$options": "i"}
    })
    
    products = await cursor.to_list(length=100)
    for p in products:
        print(f"\nProduct: {p.get('name')} (ID: {p['_id']}) Active: {p.get('is_active')}")
        
        inv_cursor = db.inventory.find({
            "tenant_id": str(tenant["_id"]),
            "producto_id": str(p["_id"])
        })
        invs = await inv_cursor.to_list(length=100)
        for i in invs:
            print(f"  -> Inv: Sucursal: {i.get('sucursal_id')}, Almacen: {i.get('almacen_id')}, Cantidad: {i.get('cantidad')}")

asyncio.run(get_db_info())
