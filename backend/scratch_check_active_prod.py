import asyncio
from app.infrastructure.db import init_db
from app.domain.models.product import Product

async def test():
    await init_db()
    
    all_prods = await Product.find_all().to_list()
    active_prods = [p for p in all_prods if p.is_active]
    
    names = {}
    dups_names = []
    for p in active_prods:
        if p.descripcion:
            n = p.descripcion.lower().strip()
            if n in names:
                dups_names.append((p, names[n]))
            else:
                names[n] = p
                
    print(f"Duplicate ACTIVE products by descripcion: {len(dups_names)}")
    if dups_names:
        for p1, p2 in dups_names[:5]:
            print(f"- {p1.descripcion}: ID {p1.id} vs ID {p2.id}")

asyncio.run(test())
