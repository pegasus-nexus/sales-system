import asyncio
import sys
import os
from decimal import Decimal

sys.path.append(os.getcwd())
from app.infrastructure.db import init_db
from app.domain.models.sale import Sale
from app.domain.models.product import Product

async def main():
    await init_db()
    
    products = await Product.find({"tenant_id": "69cd7f0a8f3f6866d4cfbb62"}).to_list()
    cost_map = {}
    for p in products:
        cost_map[p.descripcion.strip().upper()] = float(p.costo_producto)

    sales = await Sale.find({"cliente_nombre": "Cliente GenArico", "tenant_id": "69cd7f0a8f3f6866d4cfbb62"}).to_list()
    
    updates = 0
    from pymongo import UpdateOne
    ops = []
    
    for s in sales:
        changed = False
        new_items = []
        for it in s.items:
            # We want to backfill costo if it's 0
            if float(it.costo_unitario) == 0.0 and float(it.precio_unitario) > 0:
                name = it.descripcion.strip().upper() if it.descripcion else "S/N"
                if name == "S/N" and hasattr(it, 'producto_nombre'):
                   name = getattr(it, 'producto_nombre').strip().upper()
                
                if name in cost_map and cost_map[name] > 0:
                    it.costo_unitario = cost_map[name]
                else:
                    it.costo_unitario = float(it.precio_unitario) * 0.85
                changed = True
            
            d = it.model_dump()
            # Convert any Decimal to float for MongoDB insertion
            for k, v in d.items():
                if isinstance(v, Decimal):
                    d[k] = float(v)
            new_items.append(d)
            
        if changed:
            ops.append(UpdateOne(
                {"_id": s.id},
                {"$set": {"items": new_items}}
            ))
            updates += 1
            
        if len(ops) >= 1000:
            await Sale.get_motor_collection().bulk_write(ops)
            ops = []
            
    if ops:
        await Sale.get_motor_collection().bulk_write(ops)
        
    print(f"Finished backfilling costs for {updates} historical sales.")

asyncio.run(main())
