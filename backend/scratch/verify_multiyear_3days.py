import asyncio
import os
import sys
from datetime import date

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def main():
    await init_db()
    t_id = "69cd7f0a8f3f6866d4cfbb62"

    for d_str in ["2026-08-19", "2026-08-20", "2026-08-21"]:
        d_obj = date.fromisoformat(d_str)
        res = await get_hourly_multiyear(t_id, d_obj, sucursal="all")
        meta = res.get("meta", {})
        horas = res.get("horas", [])

        print(f"\n=======================================================")
        print(f"VERIFICACIÓN COMPLETA PARA {d_str}:")
        print(f"  Real 2026: Bs. {meta.get('total_real')}")
        print(f"  Año 2025:  Bs. {meta.get('total_a1')}")
        print(f"  Año 2024:  Bs. {meta.get('total_a2')}")
        print(f"  Hora Pico:  {meta.get('hora_pico')} (Bs. {meta.get('venta_pico_maxima')})")
        print("  Horas con ventas en 2026:")
        for h in horas:
            if h["real"] > 0:
                print(f"    {h['hora']} -> Bs. {h['real']}")

asyncio.run(main())
