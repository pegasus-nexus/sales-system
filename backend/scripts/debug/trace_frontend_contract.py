# -*- coding: utf-8 -*-
"""
Trazabilidad exacta de los valores retornados por get_hourly_multiyear
"""
import asyncio
import sys
from datetime import date

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

async def test_endpoint_logic():
    from app.db import init_db
    from app.services.hourly_multiyear_service import get_hourly_multiyear

    await init_db()

    print("==========================================================================")
    print("DEMOSTRACIÓN Y TRAZABILIDAD EXACTA DE VARIABLES EN MEMORIA DEL BACKEND")
    print("==========================================================================")

    for suc in ["Heroinas", "Recoleta", "Calacoto", None]:
        suc_label = suc or "GLOBAL"
        res = await get_hourly_multiyear(
            tenant_id=TENANT_ID,
            fecha_referencia=date(2026, 8, 1),
            sucursal=suc
        )

        meta = res.get("meta", {})
        horas = res.get("horas", [])

        print(f"\n[PETICIÓN DE FRONTEND PARA SUCURSAL: {suc_label}]")
        print(f"  Backend JSON meta.total_real:       {meta.get('total_real')}")
        print(f"  Backend JSON meta.total_a1:         {meta.get('total_a1')}")
        print(f"  Backend JSON meta.total_a2:         {meta.get('total_a2')}")
        print(f"  Backend JSON meta.is_reference_a1:  {meta.get('is_reference_a1')}")
        print(f"  Backend JSON meta.anio1_label:      '{meta.get('anio1_label')}'")

        chart_anio1_sum = round(sum(float(h.get("anio1", 0) or 0) for h in horas), 2)
        print(f"  Sumatoria de horas.anio1 en JSON:  {chart_anio1_sum:.2f}")

if __name__ == "__main__":
    asyncio.run(test_endpoint_logic())
