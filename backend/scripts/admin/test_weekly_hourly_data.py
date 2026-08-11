import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db
from datetime import date
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def test_weekly_dates():
    await init_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    d0 = date(2026, 8, 10)  # Lunes 10 de Agosto de 2026 (Ayer)
    d1 = date(2025, 8, 11)  # Lunes 11 de Agosto de 2025 (Hace 1 año)
    d2 = date(2024, 8, 12)  # Lunes 12 de Agosto de 2024 (Hace 2 años)

    res = await get_hourly_multiyear(
        tenant_id=tenant_id,
        fecha_referencia=d0,
        fecha_anio1=d1,
        fecha_anio2=d2,
        sucursal=None
    )

    print("==========================================================================")
    print(f"VERIFICACIÓN DE DATOS PARA LUNES: {d0} vs {d1} vs {d2}")
    print("==========================================================================")
    meta = res.get("meta", {})
    print("Meta:", meta)

    print("\nDesglose horario (Venta Neta):")
    for h in res.get("horas", []):
        if h["real"] > 0 or h["anio1"] > 0 or h["anio2"] > 0:
            print(f"  {h['hora']} -> 2026 (10-08): Bs. {h['real']:>8,.2f} | 2025 (11-08): Bs. {h['anio1']:>8,.2f} | 2024 (12-08): Bs. {h['anio2']:>8,.2f}")

if __name__ == '__main__':
    asyncio.run(test_weekly_dates())
