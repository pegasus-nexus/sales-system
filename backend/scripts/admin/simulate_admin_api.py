import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def main():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    # 1. Fetch sucursales
    sucursales = await db.sucursales.find({"tenant_id": tenant_id}).to_list(100)
    print("=== SUCURSALES IDs in DB ===")
    for s in sucursales:
        print(f"Name: {s.get('nombre')} | _id: {repr(s['_id'])} (type {type(s['_id'])}) | str(_id): {repr(str(s['_id']))}")
        
    # 2. Fetch a product with prices
    # Let's find an inventario record with precio_sucursal > 0
    inv = await db.inventario.find_one({"tenant_id": tenant_id, "precio_sucursal": {"$gt": 0}})
    if inv:
        p_id = inv['producto_id']
        prod = await db.products.find_one({"_id": ObjectId(p_id) if ObjectId.is_valid(p_id) else p_id})
        print(f"\n=== PRODUCTO: {prod.get('descripcion')} (_id: {prod['_id']}) ===")
        
        # Query inventarios for this product
        invs = await db.inventario.find({"tenant_id": tenant_id, "producto_id": str(prod['_id'])}).to_list(100)
        print("Inventario rows for this product:")
        for i in invs:
            print(f"  sucursal_id: {repr(i.get('sucursal_id'))} (type {type(i.get('sucursal_id'))}) | precio: {i.get('precio_sucursal')}")

asyncio.run(main())
