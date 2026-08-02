# -*- coding: utf-8 -*-
"""
Trazabilidad completa de la llamada de Recoleta / Calacoto.
Inspecciona:
1. Lo que retorna get_hourly_multiyear() en Python.
2. Lo que retorna la API HTTP localhost:8001.
3. El desglose exacto de las variables.
"""
import asyncio
import sys
import json
import urllib.request
import urllib.parse
from datetime import date

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

async def trace_service():
    from app.db import init_db
    from app.services.hourly_multiyear_service import get_hourly_multiyear

    await init_db()

    print("==========================================================================")
    print("1. TRAZABILIDAD DESDE EL SERVICIO PYTHON (hourly_multiyear_service.py)")
    print("==========================================================================")

    for suc in ["Heroinas", "Recoleta", "Calacoto"]:
        res = await get_hourly_multiyear(TENANT_ID, date(2026, 8, 1), sucursal=suc)
        meta = res.get("meta", {})
        horas = res.get("horas", [])

        total_real = meta.get("total_real")
        total_a1   = meta.get("total_a1")
        total_a2   = meta.get("total_a2")
        is_ref     = meta.get("is_reference_a1")

        chart_real = round(sum((h.get("real") or 0) for h in horas), 2)
        chart_a1   = round(sum((h.get("anio1") or 0) for h in horas), 2)
        chart_a2   = round(sum((h.get("anio2") or 0) for h in horas), 2)

        print(f"\n[SUCURSAL: {suc}]")
        print(f"  meta.total_real:  {total_real:.2f} Bs   | sum(horas.real):  {chart_real:.2f} Bs")
        print(f"  meta.total_a1:    {total_a1:.2f} Bs   | sum(horas.anio1): {chart_a1:.2f} Bs | is_ref: {is_ref}")
        print(f"  meta.total_a2:    {total_a2:.2f} Bs   | sum(horas.anio2): {chart_a2:.2f} Bs")
        print(f"  meta.anio1_label: {meta.get('anio1_label')}")

if __name__ == "__main__":
    asyncio.run(trace_service())
