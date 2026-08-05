import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db

async def check_net_fields():
    await init_db()
    db = await get_raw_db()

    sample_hist = await db.ventas_historicas_crudas.find_one()
    sample_sale = await db.sales.find_one()

    print("=== CAMPOS EN ventas_historicas_crudas ===")
    if sample_hist:
        for k, v in sample_hist.items():
            print(f"  • {k}: {v}")

    print("\n=== CAMPOS EN sales ===")
    if sample_sale:
        for k, v in sample_sale.items():
            print(f"  • {k}: {v}")

if __name__ == '__main__':
    asyncio.run(check_net_fields())
