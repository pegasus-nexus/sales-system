import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db
from datetime import date
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def test_patria_service():
    await init_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    res = await get_hourly_multiyear(
        tenant_id=tenant_id,
        fecha_referencia=date(2026, 8, 6),
        fecha_anio1=date(2025, 8, 6),
        fecha_anio2=date(2024, 8, 6),
        sucursal=None
    )

    meta = res.get("meta", {})
    print("=== META DIA DE LA PATRIA DE get_hourly_multiyear ===")
    print(f"2026 (Real): Bs. {meta.get('total_real')}")
    print(f"2025 (Año-1): Bs. {meta.get('total_a1')}")
    print(f"2024 (Año-2): Bs. {meta.get('total_a2')}")

    print("\nDesglose de horas en 2025:")
    sum_a1 = 0.0
    for h in res.get("horas", []):
        if h["anio1"] > 0:
            sum_a1 += h["anio1"]
            print(f"  {h['hora']} -> Bs. {h['anio1']}")
    print(f"Suma de horas 2025: Bs. {sum_a1:,.2f}")

if __name__ == '__main__':
    asyncio.run(test_patria_service())
