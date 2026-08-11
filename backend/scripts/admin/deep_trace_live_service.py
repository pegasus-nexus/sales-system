import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import date
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def trace_service():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    d0 = date(2026, 8, 10)
    d1 = date(2025, 8, 11)
    d2 = date(2024, 8, 12)

    res = await get_hourly_multiyear(
        tenant_id=tenant_id,
        fecha_referencia=d0,
        fecha_anio1=d1,
        fecha_anio2=d2,
        sucursal=None
    )

    print("==========================================================================")
    print("EJECUCIÓN DE get_hourly_multiyear EN BACKEND LOCAL:")
    print("==========================================================================")
    for h in res.get("horas", []):
        print(f"  Hora {h['hora']} -> Real: {h['real']:>8.2f} | 2025: {h['anio1']:>8.2f} | 2024: {h['anio2']:>8.2f}")

    print("\nMeta:", res.get("meta"))

if __name__ == '__main__':
    asyncio.run(trace_service())
