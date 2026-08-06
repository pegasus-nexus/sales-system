import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db
from datetime import date
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def test_today():
    await init_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    res = await get_hourly_multiyear(
        tenant_id=tenant_id,
        fecha_referencia=date(2026, 8, 5),
        sucursal=None
    )

    meta = res.get("meta", {})
    print("=== RESULTADO get_hourly_multiyear PARA HOY (05/08/2026) ===")
    print(f"2026 (Real Venta Neta): Bs. {meta.get('total_real'):,.2f}")
    print(f"2025 (Hace 1 año - 06/08/2025): Bs. {meta.get('total_a1'):,.2f}")
    print(f"2024 (Hace 2 años - 07/08/2024): Bs. {meta.get('total_a2'):,.2f}")

    print("\nDesglose por horas en 2026 (Venta Neta):")
    for h in res.get("horas", []):
        if h["real"] > 0 or h["anio1"] > 0 or h["anio2"] > 0:
            print(f"  {h['hora']} -> 2026: Bs. {h['real']:,.2f} | 2025: Bs. {h['anio1']:,.2f} | 2024: Bs. {h['anio2']:,.2f}")

if __name__ == '__main__':
    asyncio.run(test_today())
