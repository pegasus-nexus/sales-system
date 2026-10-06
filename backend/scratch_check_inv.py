import asyncio
from app.infrastructure.db import init_db
from app.domain.models.inventario import Inventario
from app.domain.models.product import Product

async def test():
    await init_db()
    
    # Let's find all inventario documents
    all_inv = await Inventario.find_all().to_list()
    print(f"Total Inventario records: {len(all_inv)}")
    
    # Check for duplicates per sucursal + producto
    seen = {}
    duplicates = []
    
    for inv in all_inv:
        key = f"{inv.sucursal_id}_{inv.producto_id}"
        if key in seen:
            duplicates.append((inv, seen[key]))
        else:
            seen[key] = inv
            
    print(f"Found {len(duplicates)} duplicate pairs!")
    
    if duplicates:
        # Show details of the first 5 duplicates
        for inv1, inv2 in duplicates[:5]:
            p = await Product.get(inv1.producto_id)
            print("-" * 40)
            print(f"Product: {p.descripcion if p else 'UNKNOWN'} (ID: {inv1.producto_id})")
            print(f"Sucursal: {inv1.sucursal_id}")
            print(f"Record 1 (ID: {inv1.id}): {inv1.cantidad} unidades, status: {'ACTIVE' if inv1.is_active else 'DELETED'}")
            print(f"Record 2 (ID: {inv2.id}): {inv2.cantidad} unidades, status: {'ACTIVE' if inv2.is_active else 'DELETED'}")

asyncio.run(test())
