import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.infrastructure.repositories.mongo_analytics_repository import MongoAnalyticsRepository

async def test_day_sanitized(d_str: str):
    repo = MongoAnalyticsRepository()
    # Simular lo que FastAPI recibe cuando el cliente envía ISO strings
    dt_s = datetime.strptime(d_str + "T00:00:00", "%Y-%m-%dT%H:%M:%S")
    dt_e = datetime.strptime(d_str + "T23:59:59", "%Y-%m-%dT%H:%M:%S")

    totales = await repo.get_total_sales_and_orders("69cd7f0a8f3f6866d4cfbb62", dt_s, dt_e, None)
    dist = await repo.get_hourly_sales_distribution("69cd7f0a8f3f6866d4cfbb62", dt_s, dt_e, None)

    print(f"=== RESULTADOS SANITIZADOS PARA {d_str} ===")
    print(f"  Ventas Brutas Totales: Bs. {totales['total_ventas']:.2f}")
    print(f"  Cantidad de Órdenes:   {totales['cantidad_ventas']}")
    print(f"  Horas con ventas:      {len(dist)}")
    print("  Desglose por horas:")
    for h in dist:
        print(f"    Hora {h['_id']:02d}:00 -> Bs. {h['total_ventas']:.2f} ({h['cantidad_ventas']} ventas)")

async def main():
    await init_db()
    await test_day_sanitized("2026-08-19")
    await test_day_sanitized("2026-08-20")
    await test_day_sanitized("2026-08-21")

asyncio.run(main())
