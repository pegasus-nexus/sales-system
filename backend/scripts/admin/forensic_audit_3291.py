import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime, date, timedelta
import pandas as pd

async def deep_audit():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    print("=================================================================")
    print("AUDITORÍA FORENSE: BÚSQUEDA DE DÓNDE SALE 3,291.50 vs 3,279.00")
    print("=================================================================")

    # 1. Chequear ventas_historicas_crudas el 2025-08-06 con Rango Naive vs Rango UTC Bolivia
    dt_naive_start = datetime(2025, 8, 6, 0, 0, 0)
    dt_naive_end = datetime(2025, 8, 6, 23, 59, 59)

    ts_bolivia = pd.Timestamp("2025-08-06", tz="America/La_Paz")
    dt_utc_start = ts_bolivia.tz_convert("UTC").to_pydatetime()
    dt_utc_end = (ts_bolivia + pd.Timedelta(days=1)).tz_convert("UTC").to_pydatetime()

    # Naive query en Heroínas
    docs_naive_hero = await db.ventas_historicas_crudas.find({
        "tenant_id": tenant_id,
        "fecha_transaccion": {"$gte": dt_naive_start, "$lte": dt_naive_end},
        "sucursal": {"$regex": "Hero.*nas", "$options": "i"}
    }).to_list(1000)
    total_naive_hero = sum(float(str(d.get("monto_total_bs", 0))) for d in docs_naive_hero)

    # UTC query en Heroínas
    docs_utc_hero = await db.ventas_historicas_crudas.find({
        "tenant_id": tenant_id,
        "fecha_transaccion": {"$gte": dt_utc_start, "$lt": dt_utc_end},
        "sucursal": {"$regex": "Hero.*nas", "$options": "i"}
    }).to_list(1000)
    total_utc_hero = sum(float(str(d.get("monto_total_bs", 0))) for d in docs_utc_hero)

    print(f"Heroínas 06/08/2025 Naive (00:00 a 23:59): Bs. {total_naive_hero:,.2f} ({len(docs_naive_hero)} docs)")
    print(f"Heroínas 06/08/2025 UTC Bolivia (04:00 a 04:00): Bs. {total_utc_hero:,.2f} ({len(docs_utc_hero)} docs)")

    # Chequear si existe la colección 'sales' en 2025-08-06
    sales_2025 = await db.sales.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": dt_utc_start, "$lt": dt_utc_end}
    }).to_list(1000)
    total_sales_2025 = sum(float(str(s.get("total", 0))) for s in sales_2025)
    print(f"Colección 'sales' en 06/08/2025: Bs. {total_sales_2025:,.2f} ({len(sales_2025)} docs)")

    # Probar con get_hourly_multiyear directamente
    from app.services.hourly_multiyear_service import get_hourly_multiyear
    res_multi = await get_hourly_multiyear(tenant_id, date(2026, 8, 5), date(2025, 8, 6), date(2024, 8, 7))
    print("\nResultado directo de get_hourly_multiyear:")
    print("  total_a1 (2025):", res_multi.get("meta", {}).get("total_a1"))
    print("  total_a2 (2024):", res_multi.get("meta", {}).get("total_a2"))

    # Chequear si 2025-08-06 en sales O en ventas_historicas_crudas tiene alguna otra sucursal
    distinct_sucs_hist = await db.ventas_historicas_crudas.distinct("sucursal", {"fecha_transaccion": {"$gte": dt_naive_start, "$lte": dt_naive_end}})
    print("\nSucursales distintas en ventas_historicas_crudas (06/08/2025):", distinct_sucs_hist)

if __name__ == '__main__':
    asyncio.run(deep_audit())
