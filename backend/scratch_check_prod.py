import asyncio
from app.infrastructure.db import init_db
from app.domain.models.inventario import Inventario
from app.domain.models.product import Product

async def test():
    await init_db()
    
    # 1. Are there products with the same codigo_corto?
    all_prods = await Product.find_all().to_list()
    print(f"Total Products: {len(all_prods)}")
    
    codes = {}
    dups_codes = []
    for p in all_prods:
        if p.codigo_corto:
            c = p.codigo_corto.lower()
            if c in codes:
                dups_codes.append((p, codes[c]))
            else:
                codes[c] = p
                
    print(f"Duplicate products by codigo_corto: {len(dups_codes)}")
    if dups_codes:
        for p1, p2 in dups_codes[:5]:
            print(f"- {p1.codigo_corto}: '{p1.descripcion}' ({p1.id}) vs '{p2.descripcion}' ({p2.id})")
            
    # 2. Are there products with the same descripcion?
    names = {}
    dups_names = []
    for p in all_prods:
        if p.descripcion:
            n = p.descripcion.lower().strip()
            if n in names:
                dups_names.append((p, names[n]))
            else:
                names[n] = p
                
    print(f"Duplicate products by descripcion: {len(dups_names)}")
    if dups_names:
        for p1, p2 in dups_names[:5]:
            print(f"- {p1.descripcion}: ID {p1.id} vs ID {p2.id}")
            

asyncio.run(test())
