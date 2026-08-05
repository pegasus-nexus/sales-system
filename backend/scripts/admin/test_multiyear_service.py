import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db
from datetime import date
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def test_multiyear():
    await init_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    print("=== PROBANDO get_hourly_multiyear PARA 2026-04-03 (Sin Sucursal / Todas) ===")
    res_all = await get_hourly_multiyear(tenant_id, date(2026, 4, 3), sucursal=None)
    print("META RESULTADO TODAS:", res_all.get("meta"))
    print("HORAS CON VENTAS:", [h for h in res_all.get("horas", []) if h["real"] > 0 or h["anio1"] > 0 or h["anio2"] > 0])

    print("\n=== PROBANDO get_hourly_multiyear PARA 2026-04-03 (Sucursal Heroínas) ===")
    res_hero = await get_hourly_multiyear(tenant_id, date(2026, 4, 3), sucursal="Heroinas")
    print("META RESULTADO HEROÍNAS:", res_hero.get("meta"))

if __name__ == '__main__':
    asyncio.run(test_multiyear())
