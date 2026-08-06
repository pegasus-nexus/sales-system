import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime

async def check_global_hist():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    start_date = datetime(2025, 8, 6, 0, 0, 0)
    end_date = datetime(2025, 8, 6, 23, 59, 59)

    # 1. Sin filtro de sucursal (Todas las Sucursales en 2025-08-06)
    docs_all = await db.ventas_historicas_crudas.find({
        "tenant_id": tenant_id,
        "fecha_transaccion": {"$gte": start_date, "$lte": end_date}
    }).to_list(1000)

    print(f"1. TODAS LAS SUCURSALES (06/08/2025): {len(docs_all)} docs | Suma Total: Bs. {sum(float(str(d.get('monto_total_bs', 0))) for d in docs_all):,.2f}")

    # 2. Solo Heroínas
    docs_hero = await db.ventas_historicas_crudas.find({
        "tenant_id": tenant_id,
        "fecha_transaccion": {"$gte": start_date, "$lte": end_date},
        "sucursal": {"$regex": "Hero.*nas", "$options": "i"}
    }).to_list(1000)
    print(f"2. SOLO HEROÍNAS (06/08/2025): {len(docs_hero)} docs | Suma Total: Bs. {sum(float(str(d.get('monto_total_bs', 0))) for d in docs_hero):,.2f}")

    # 3. Muestra de 2026-08-05 (Hoy)
    start_2026 = datetime(2026, 8, 5, 0, 0, 0)
    end_2026 = datetime(2026, 8, 5, 23, 59, 59)
    sales_2026 = await db.sales.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": datetime(2026, 8, 5, 4, 0, 0), "$lt": datetime(2026, 8, 6, 4, 0, 0)},
        "anulada": {"$ne": True}
    }).to_list(1000)
    print(f"3. HOY 05/08/2026 EN POS: {len(sales_2026)} ventas | Suma Gross: Bs. {sum(float(str(s.get('total', 0))) for s in sales_2026):,.2f}")

if __name__ == '__main__':
    asyncio.run(check_global_hist())
