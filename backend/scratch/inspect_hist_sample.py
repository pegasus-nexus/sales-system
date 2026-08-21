import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def inspect_docs():
    await init_db()
    db = await get_raw_db()
    
    start_2025 = datetime(2025, 8, 22, 0, 0, 0)
    end_2025 = datetime(2025, 8, 22, 23, 59, 59)
    
    start_2024 = datetime(2024, 8, 23, 0, 0, 0)
    end_2024 = datetime(2024, 8, 23, 23, 59, 59)

    docs_2025 = await db.ventas_historicas_crudas.find({
        "fecha_transaccion": {"$gte": start_2025, "$lte": end_2025},
        "sucursal": {"$regex": "Hero", "$options": "i"}
    }).to_list(5)

    docs_2024 = await db.ventas_historicas_crudas.find({
        "fecha_transaccion": {"$gte": start_2024, "$lte": end_2024},
        "sucursal": {"$regex": "Hero", "$options": "i"}
    }).to_list(5)

    print("Muestra 2025:")
    for d in docs_2025:
        print("  -", d.get("fecha_transaccion"), "| Monto:", d.get("monto_total_bs"), "| Total:", d.get("total"), "| Neto:", d.get("monto_neto"), "| Documento:", d.get("documento"))

    print("\nMuestra 2024:")
    for d in docs_2024:
        print("  -", d.get("fecha_transaccion"), "| Monto:", d.get("monto_total_bs"), "| Total:", d.get("total"), "| Neto:", d.get("monto_neto"), "| Documento:", d.get("documento"))

asyncio.run(inspect_docs())
