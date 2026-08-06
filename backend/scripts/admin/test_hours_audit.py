import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime

async def test_hours():
    await init_db()
    db = await get_raw_db()

    # 1. Chequear documentos de ventas_historicas_crudas el 06/08/2025
    sample_hist = await db.ventas_historicas_crudas.find({
        "fecha_transaccion": {"$gte": datetime(2025, 8, 6, 0, 0, 0), "$lte": datetime(2025, 8, 6, 23, 59, 59)}
    }).limit(10).to_list(10)

    print("=== MUESTRA DE HORA EN ventas_historicas_crudas (06/08/2025) ===")
    for h in sample_hist:
        ft = h.get("fecha_transaccion")
        pname = str(h.get('nombre_producto') or '')
        print(f"  - Producto: {pname[:25]:<25} | fecha_transaccion: {ft} | type: {type(ft)} | hour: {ft.hour if isinstance(ft, datetime) else 'N/A'}")

    # 2. Chequear documentos de sales hoy 05/08/2026
    sample_sales = await db.sales.find({
        "created_at": {"$gte": datetime(2026, 8, 5, 0, 0, 0)}
    }).limit(10).to_list(10)

    print("\n=== MUESTRA DE HORA EN sales (05/08/2026) ===")
    for s in sample_sales:
        ca = s.get("created_at")
        print(f"  • Sale ID: {s.get('_id')} | created_at: {ca} | UTC hour: {ca.hour if isinstance(ca, datetime) else 'N/A'} | Bolivia hour (UTC-4): {(ca.hour - 4) % 24 if isinstance(ca, datetime) else 'N/A'}")

if __name__ == '__main__':
    asyncio.run(test_hours())
