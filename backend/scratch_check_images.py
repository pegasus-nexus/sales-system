import asyncio
from app.infrastructure.db import init_db
from app.domain.models.product import Product
from app.domain.models.inventario import Inventario
from collections import defaultdict

async def test():
    await init_db()
    
    all_prods = await Product.find_all().to_list()
    active_prods = [p for p in all_prods if p.is_active]
    
    by_name = defaultdict(list)
    for p in active_prods:
        if p.descripcion:
            n = p.descripcion.lower().strip()
            by_name[n].append(p)
            
    dups = {k: v for k, v in by_name.items() if len(v) > 1}
    
    total_images_in_dups = 0
    
    for name, prods in dups.items():
        with_image = [p for p in prods if getattr(p, "image_url", None)]
        if with_image:
            total_images_in_dups += 1
            
    print(f"Total groups with at least one image: {total_images_in_dups} out of {len(dups)}")

asyncio.run(test())
