import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db

async def inspect_fields():
    await init_db()
    db = await get_raw_db()

    # Inspeccionar 50 documentos de ventas_historicas_crudas
    hist_docs = await db.ventas_historicas_crudas.find().limit(50).to_list(50)
    all_hist_keys = set()
    for d in hist_docs:
        all_hist_keys.update(d.keys())

    print("=== TODOS LOS CAMPOS ENCONTRADOS EN ventas_historicas_crudas ===")
    print(sorted(list(all_hist_keys)))

    # Inspeccionar 50 documentos de sales
    sales_docs = await db.sales.find().limit(50).to_list(50)
    all_sales_keys = set()
    for d in sales_docs:
        all_sales_keys.update(d.keys())

    print("\n=== TODOS LOS CAMPOS ENCONTRADOS EN sales ===")
    print(sorted(list(all_sales_keys)))

if __name__ == '__main__':
    asyncio.run(inspect_fields())
