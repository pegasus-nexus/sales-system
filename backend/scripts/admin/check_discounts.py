import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db

async def check_discounts():
    await init_db()
    db = await get_raw_db()

    sales_with_disc = await db.sales.find({"descuento": {"$ne": None}}).to_list(50)
    print(f"Total ventas con descuento de nivel superior: {len(sales_with_disc)}")
    for s in sales_with_disc[:5]:
        print(f"  • Total: {s.get('total')} | Descuento: {s.get('descuento')}")

    # Chequear ítems con descuento_unitario > 0
    sales_item_disc = await db.sales.find({"items.descuento_unitario": {"$gt": 0}}).to_list(50)
    print(f"\nTotal ventas con descuento unitario en ítems: {len(sales_item_disc)}")

if __name__ == '__main__':
    asyncio.run(check_discounts())
