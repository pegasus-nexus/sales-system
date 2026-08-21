import asyncio
import os
import sys
from datetime import date

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def main():
    await init_db()
    
    # 20/08/2026 is Jueves.
    # Equivalent 1 year ago: Jueves 21/08/2025
    # Equivalent 2 years ago: Jueves 22/08/2024
    
    f0 = date(2026, 8, 20)
    f1 = date(2025, 8, 21)
    f2 = date(2024, 8, 22)

    for suc in ["Heroinas", "Recoleta", "Calacoto"]:
        res = await get_hourly_multiyear(
            tenant_id="69cd7f0a8f3f6866d4cfbb62",
            fecha_referencia=f0,
            fecha_anio1=f1,
            fecha_anio2=f2,
            sucursal=suc
        )
        meta = res.get("meta", {})
        print(f"=== SUCURSAL: {suc} ===")
        print(f"  F0 (20/08/2026): Bs. {meta.get('total_real'):>8.2f}")
        print(f"  F1 (21/08/2025): Bs. {meta.get('total_a1'):>8.2f}")
        print(f"  F2 (22/08/2024): Bs. {meta.get('total_a2'):>8.2f}")
        print(f"  Hora pico F0:    {meta.get('hora_pico')} (Bs. {meta.get('venta_pico_maxima'):.2f})\n")

asyncio.run(main())
