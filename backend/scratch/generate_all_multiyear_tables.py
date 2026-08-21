import asyncio
import os
import sys
from datetime import date

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def generate_all_tables():
    await init_db()
    f0 = date(2026, 8, 20)
    f1 = date(2025, 8, 21)
    f2 = date(2024, 8, 22)

    branches = [
        ("all", "GLOBAL (TODAS LAS SUCURSALES)"),
        ("Heroinas", "SUCURSAL HEROÍNAS"),
        ("Recoleta", "SUCURSAL RECOLETA"),
        ("Calacoto", "SUCURSAL CALACOTO")
    ]

    for b_code, b_name in branches:
        res = await get_hourly_multiyear("69cd7f0a8f3f6866d4cfbb62", f0, f1, f2, b_code)
        horas = res.get("horas", [])
        meta = res.get("meta", {})
        print(f"\n=======================================================")
        print(f"{b_name}")
        print(f"Total 20/08/2026: Bs. {meta['total_real']:.2f} | Total 21/08/2025: Bs. {meta['total_a1']:.2f} | Total 22/08/2024: Bs. {meta['total_a2']:.2f}")
        print(f"Hora Pico 2026: {meta['hora_pico']} (Bs. {meta['venta_pico_maxima']:.2f})")
        print("-------------------------------------------------------")
        print(f"{'Hora':<7} | {'20/08/2026 (Ayer)':<18} | {'21/08/2025 (-1 yr)':<18} | {'22/08/2024 (-2 yr)':<18}")
        print("-------------------------------------------------------")
        for h in horas:
            if h["real"] > 0 or h["anio1"] > 0 or h["anio2"] > 0:
                print(f"{h['hora']:<7} | Bs. {h['real']:>14.2f} | Bs. {h['anio1']:>14.2f} | Bs. {h['anio2']:>14.2f}")

asyncio.run(generate_all_tables())
