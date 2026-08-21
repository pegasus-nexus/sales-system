import asyncio
import os
import sys
from datetime import date

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def main():
    await init_db()
    res = await get_hourly_multiyear(
        tenant_id="69cd7f0a8f3f6866d4cfbb62",
        fecha_referencia=date(2026, 8, 21),
        fecha_anio1=date(2025, 8, 22),
        fecha_anio2=date(2024, 8, 23),
        sucursal="Heroinas"
    )
    
    meta = res.get("meta", {})
    horas = res.get("horas", [])

    print("=== TEST COMPLETADO CON ÉXITO ===")
    print(f"Total 2026: Bs. {meta.get('total_real')}")
    print(f"Total 2025: Bs. {meta.get('total_a1')}")
    print(f"Total 2024: Bs. {meta.get('total_a2')}")
    print("\nPrimeras 5 horas de ejemplo:")
    for h in horas[:5]:
        print(f"  {h['hora']} | 2026: Bs. {h['real']:>6.2f} | 2025: Bs. {h['anio1']:>6.2f} | 2024: Bs. {h['anio2']:>6.2f}")

asyncio.run(main())
