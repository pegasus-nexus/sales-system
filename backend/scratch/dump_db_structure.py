import asyncio
import json
import os
import sys
from bson import json_util

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def main():
    await init_db()
    db = await get_raw_db()

    # 1. List all collections in DB
    collections = await db.list_collection_names()
    print("=== COLECCIONES EXISTENTES EN MONGO DB ===")
    for c in sorted(collections):
        count = await db[c].count_documents({})
        print(f"  • {c:<35}: {count} documentos")

    # 2. Get a real sample document from sales
    sample_sale = await db.sales.find_one({"total": {"$gt": 0}})
    print("\n=== EJEMPLO REAL DE UN DOCUMENTO DE VENTA (colección 'sales') ===")
    if sample_sale:
        print(json.dumps(json.loads(json_util.dumps(sample_sale)), indent=2, ensure_ascii=False))

    # 3. Get a real sample document from ventas_historicas_crudas
    sample_hist = await db.ventas_historicas_crudas.find_one({})
    print("\n=== EJEMPLO REAL DE VENTAS HISTORICAS (colección 'ventas_historicas_crudas') ===")
    if sample_hist:
        print(json.dumps(json.loads(json_util.dumps(sample_hist)), indent=2, ensure_ascii=False))

asyncio.run(main())
