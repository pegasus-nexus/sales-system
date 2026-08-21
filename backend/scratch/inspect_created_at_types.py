import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def main():
    await init_db()
    db = await get_raw_db()

    sales = await db.sales.find({}).sort("_id", -1).to_list(20)
    print("=== TIPOS DE CAMPO created_at EN LAS ÚLTIMAS 20 VENTAS DE sales ===")
    for s in sales:
        c_at = s.get("created_at")
        f_at = s.get("fecha")
        f_tx = s.get("fecha_transaccion")
        print(f"  ID: {s['_id']} | created_at: {c_at} ({type(c_at).__name__}) | fecha: {f_at} ({type(f_at).__name__}) | fecha_tx: {f_tx} ({type(f_tx).__name__}) | total: {s.get('total')}")

asyncio.run(main())
