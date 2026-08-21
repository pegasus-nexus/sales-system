import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def check_tz_hist():
    await init_db()
    db = await get_raw_db()

    start_hist = datetime(2025, 8, 21, 0, 0, 0)
    end_hist = datetime(2025, 8, 21, 23, 59, 59)

    # Fetch 5 sample docs from ventas_historicas_crudas
    sample_hist = await db.ventas_historicas_crudas.find({
        "fecha_transaccion": {"$gte": start_hist, "$lte": end_hist},
        "sucursal": {"$regex": "Hero", "$options": "i"}
    }).to_list(5)

    print("=== MUESTRA DE DOCUMENTOS HISTÓRICOS 2025 ===")
    for d in sample_hist:
        print(f"  fecha_transaccion: {d.get('fecha_transaccion')} (tipo: {type(d.get('fecha_transaccion'))}) | monto: {d.get('monto_total_bs')}")

    # Check 2026 sales in sales
    start_2026 = datetime(2026, 8, 20, 0, 0, 0)
    end_2026 = datetime(2026, 8, 20, 23, 59, 59)
    sample_sales = await db.sales.find({
        "created_at": {"$gte": start_2026, "$lte": end_2026}
    }).to_list(5)

    print("\n=== MUESTRA DE DOCUMENTOS LIVE 2026 (sales) ===")
    for d in sample_sales:
        print(f"  created_at: {d.get('created_at')} (tipo: {type(d.get('created_at'))}) | total: {d.get('total')}")

asyncio.run(check_tz_hist())
