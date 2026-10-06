import asyncio
from app.infrastructure.db import init_db
from app.domain.models.product import Product

async def test():
    await init_db()
    
    all_prods = await Product.find_all().to_list()
    active_prods = [p for p in all_prods if p.is_active]
    
    from collections import defaultdict
    by_name = defaultdict(list)
    for p in active_prods:
        if p.descripcion:
            n = p.descripcion.lower().strip()
            by_name[n].append(p)
            
    dups = {k: v for k, v in by_name.items() if len(v) > 1}
    
    print(f"Groups of duplicate ACTIVE products: {len(dups)}")
    count = 0
    for name, prods in dups.items():
        if count >= 3:
            break
        print(f"\n--- {name} ---")
        for p in prods:
            print(f"ID: {p.id}")
            print(f"  Codigo: {p.codigo_corto}")
            print(f"  Categoria: {p.categoria_id}")
            print(f"  Proveedor: {p.proveedores}")
        count += 1
            

asyncio.run(test())
