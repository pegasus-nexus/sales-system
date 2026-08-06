import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime

async def check_hero():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    start_date = datetime(2025, 8, 6, 0, 0, 0)
    end_date = datetime(2025, 8, 6, 23, 59, 59)

    # 1. Regex "Hero.*nas"
    docs_regex = await db.ventas_historicas_crudas.find({
        "tenant_id": tenant_id,
        "fecha_transaccion": {"$gte": start_date, "$lte": end_date},
        "sucursal": {"$regex": "Hero.*nas", "$options": "i"}
    }).to_list(1000)

    total_regex = sum(float(str(d.get("monto_total_bs", 0))) for d in docs_regex)
    print(f"Total con regex 'Hero.*nas': Bs. {total_regex:,.2f} ({len(docs_regex)} docs)")

    # 2. Distintos nombres de sucursal
    distinct_sucs = await db.ventas_historicas_crudas.distinct("sucursal", {
        "tenant_id": tenant_id,
        "fecha_transaccion": {"$gte": start_date, "$lte": end_date}
    })
    print("Sucursales distintas en 06/08/2025:", distinct_sucs)

    for s_name in distinct_sucs:
        s_docs = await db.ventas_historicas_crudas.find({
            "tenant_id": tenant_id,
            "fecha_transaccion": {"$gte": start_date, "$lte": end_date},
            "sucursal": s_name
        }).to_list(1000)
        s_total = sum(float(str(d.get("monto_total_bs", 0))) for d in s_docs)
        print(f"  • Sucursal exact '{s_name}': Bs. {s_total:,.2f} ({len(s_docs)} docs)")

if __name__ == '__main__':
    asyncio.run(check_hero())
