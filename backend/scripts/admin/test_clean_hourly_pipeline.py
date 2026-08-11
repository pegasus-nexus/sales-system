import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db
from datetime import date
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def test_clean_pipeline():
    await init_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    d0 = date(2026, 8, 10) # Lunes
    d1 = date(2025, 8, 11)
    d2 = date(2024, 8, 12)

    res = await get_hourly_multiyear(tenant_id, d0, d1, d2, sucursal="")

    print("==========================================================================")
    print("VERIFICACIÓN DE VERDAD MATEMÁTICA PURA DESDE MONGODB:")
    print("==========================================================================")
    meta = res.get("meta", {})
    horas = res.get("horas", [])

    total_real_chart = sum(h["real"] for h in horas)
    total_a1_chart = sum(h["anio1"] for h in horas)
    total_a2_chart = sum(h["anio2"] for h in horas)

    print(f"Meta Total Real: Bs. {meta.get('total_real'):,.2f} | Suma Gráfico Real: Bs. {total_real_chart:,.2f}")
    print(f"Meta Total A1:   Bs. {meta.get('total_a1'):,.2f} | Suma Gráfico A1:   Bs. {total_a1_chart:,.2f}")
    print(f"Meta Total A2:   Bs. {meta.get('total_a2'):,.2f} | Suma Gráfico A2:   Bs. {total_a2_chart:,.2f}")
    print(f"Docs Real (POS): {meta.get('docs_real')} órdenes")
    print(f"Docs A1 (2025):  {meta.get('docs_a1')} órdenes")
    print(f"Hora Pico:       {meta.get('hora_pico')} hs ({meta.get('venta_pico_maxima'):,.2f} Bs.)")

    print("\nDesglose Horario 06:00 a 23:00:")
    for h in horas:
        print(f"  • {h['hora']} -> 2026: Bs. {h['real']:>8,.2f} | 2025: Bs. {h['anio1']:>8,.2f} | 2024: Bs. {h['anio2']:>8,.2f}")

if __name__ == '__main__':
    asyncio.run(test_clean_pipeline())
