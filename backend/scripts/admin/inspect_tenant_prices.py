import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    t_id = "69cd7f0a8f3f6866d4cfbb62"
    print(f"\n--- Analizando Tenant de los usuarios activos: {t_id} ---")
    
    # Sucursales
    sucursales = await db.sucursales.find({"tenant_id": t_id}).to_list(100)
    print(f"Sucursales encontradas ({len(sucursales)}):")
    for s in sucursales:
        s_id = str(s['_id'])
        s_name = s.get('nombre')
        c_gt0 = await db.inventario.count_documents({"tenant_id": t_id, "sucursal_id": s_id, "precio_sucursal": {"$gt": 0}})
        c_0 = await db.inventario.count_documents({"tenant_id": t_id, "sucursal_id": s_id, "$or": [{"precio_sucursal": 0}, {"precio_sucursal": None}, {"precio_sucursal": {"$exists": False}}]})
        print(f"  - Sucursal '{s_name}' ({s_id}): {c_gt0} productos con precio > 0, {c_0} productos sin precio (0 o null)")
        
    # Products count
    prod_count = await db.products.count_documents({"tenant_id": t_id})
    print(f"\nTotal productos en este tenant: {prod_count}")
    
    # Sample products
    sample_prods = await db.products.find({"tenant_id": t_id}).limit(10).to_list(10)
    print("\nMuestra de productos:")
    for p in sample_prods:
        print(f"  - Prod ID: {p['_id']} | Desc: {p.get('descripcion')} | precio_venta: {p.get('precio_venta')}")
        
    # Inventario for this tenant
    inv_count = await db.inventario.count_documents({"tenant_id": t_id})
    print(f"\nTotal registros inventario en este tenant: {inv_count}")
    
    inv_with_price = await db.inventario.find({"tenant_id": t_id, "precio_sucursal": {"$gt": 0}}).to_list(10)
    print(f"\nInventarios con precio_sucursal > 0 en este tenant ({len(inv_with_price)} muestras):")
    for i in inv_with_price:
        print(f"  - Inv ID: {i['_id']} | Prod: {i.get('producto_id')} | Suc: {i.get('sucursal_id')} | Precio: {i.get('precio_sucursal')}")

asyncio.run(main())
