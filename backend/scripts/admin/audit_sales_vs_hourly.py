import asyncio
import sys
import os
from datetime import datetime, date, timezone, timedelta
import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from app.utils.date_utils import get_day_range_bolivia, utc_to_bolivia, now_bolivia
from app.domain.models.sale import Sale
from app.services.hourly_multiyear_service import get_hourly_multiyear, _build_sucursal_filter

async def run_comparative_audit():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    bo_tz = timezone(timedelta(hours=-4))

    print("==========================================================================")
    print("1. AUDITORÍA HISTORIAL DE VENTAS (MÓDULO 'VENTAS' / SALES.PY)")
    print("==========================================================================")
    d_today_str = "2026-08-11"
    start_dt, end_dt = get_day_range_bolivia(d_today_str)
    print(f"Rango Bolivia (get_day_range_bolivia): {start_dt.isoformat()} a {end_dt.isoformat()}")

    # Consulta de Sales / Ventas como en sales.py
    sales_query = [
        Sale.tenant_id == tenant_id,
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt,
        Sale.anulada == False
    ]
    sales_list = await Sale.find(*sales_query).sort(-Sale.created_at).to_list()
    print(f"Ventas encontradas por Historial de Ventas: {len(sales_list)} documentos")
    
    tot_historia = sum(s.total for s in sales_list)
    print(f"Total Neto Historial de Ventas: Bs. {tot_historia:,.2f}")

    for s in sales_list:
        ca_utc = s.created_at
        ca_bo = utc_to_bolivia(ca_utc)
        print(f"  • Sale ID: {s.id} | Total: Bs. {s.total:>7.2f} | created_at UTC: {ca_utc.strftime('%Y-%m-%d %H:%M:%S')} | Bolivia Local: {ca_bo.strftime('%Y-%m-%d %H:%M:%S %p')} (Hora: {ca_bo.hour:02d}:00)")

    print("\n==========================================================================")
    print("2. AUDITORÍA COMPARATIVA HORARIA (HOURLY_MULTIYEAR_SERVICE.PY)")
    print("==========================================================================")
    
    # Probar con sucursal = None, "", "Heroinas"
    for suc in [None, "", "Heroinas"]:
        suc_f = await _build_sucursal_filter(db, tenant_id, suc)
        print(f"\nSucursal Filtro '{suc}': {suc_f}")

    res_comp = await get_hourly_multiyear(tenant_id, date(2026, 8, 11), sucursal=None)
    meta = res_comp.get("meta", {})
    horas = res_comp.get("horas", [])

    print(f"Total Real Meta Comparativa: Bs. {meta.get('total_real')}")
    print(f"Suma Horas Real Comparativa: Bs. {sum(h['real'] for h in horas):,.2f}")
    for h in horas:
        if h['real'] > 0 or h['anio1'] > 0:
            print(f"  • Hora {h['hora']} -> Real: Bs. {h['real']:>7.2f} | 2025: Bs. {h['anio1']:>7.2f}")

if __name__ == '__main__':
    asyncio.run(run_comparative_audit())
