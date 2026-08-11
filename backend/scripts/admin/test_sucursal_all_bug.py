import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db
from datetime import date
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def test_sucursal_param():
    await init_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    d0 = date(2026, 8, 10)
    d1 = date(2025, 8, 11)
    d2 = date(2024, 8, 12)

    res_empty = await get_hourly_multiyear(tenant_id, d0, d1, d2, sucursal="")
    res_none = await get_hourly_multiyear(tenant_id, d0, d1, d2, sucursal=None)
    res_all = await get_hourly_multiyear(tenant_id, d0, d1, d2, sucursal="all")
    res_todas = await get_hourly_multiyear(tenant_id, d0, d1, d2, sucursal="Todas")

    print("==========================================================================")
    print("COMPARATIVA DE PARÁMETRO 'sucursal':")
    print("==========================================================================")
    print("sucursal='' (Vacio):", res_empty.get("meta"))
    print("sucursal=None:      ", res_none.get("meta"))
    print("sucursal='all':     ", res_all.get("meta"))
    print("sucursal='Todas':   ", res_todas.get("meta"))

if __name__ == '__main__':
    asyncio.run(test_sucursal_param())
