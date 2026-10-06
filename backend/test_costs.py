import asyncio
import sys
import os

sys.path.append(os.getcwd())
from app.infrastructure.db import init_db
from app.domain.models.sale import Sale

async def main():
    await init_db()
    # Check historical
    hist = await Sale.find({"cliente_nombre": "Cliente GenArico"}).limit(1).to_list()
    if hist:
        print("Historical item:", hist[0].items[0] if hist[0].items else "No items")
    
    # Check recent (not generic client, from POS)
    recent = await Sale.find({"cliente_nombre": {"$ne": "Cliente GenArico"}}).sort("-created_at").limit(5).to_list()
    for r in recent:
        if r.items:
            for it in r.items:
                print(f"Recent item: {it.producto_nombre} | Precio: {it.precio_unitario} | Costo: {it.costo_unitario}")

asyncio.run(main())
