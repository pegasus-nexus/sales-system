import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime, timedelta

async def find_amount():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    print("=== BUSCANDO FECHA CON FACTURACIÓN DE 3,291.50 O SIMILAR EN AGOSTO 2025 ===")
    for day in range(1, 31):
        dt_start = datetime(2025, 8, day, 0, 0, 0)
        dt_end = datetime(2025, 8, day, 23, 59, 59)

        pipeline = [
            {"$match": {
                "tenant_id": tenant_id,
                "fecha_transaccion": {"$gte": dt_start, "$lte": dt_end},
                "sucursal": {"$regex": "Hero.*nas", "$options": "i"}
            }},
            {"$group": {
                "_id": None,
                "total": {"$sum": "$monto_total_bs"}
            }}
        ]
        res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(1)
        tot = res[0]["total"] if res else 0.0
        if tot > 0:
            print(f"  • Fecha 2025-08-{day:02d}: Bs. {tot:,.2f}")

if __name__ == '__main__':
    asyncio.run(find_amount())
