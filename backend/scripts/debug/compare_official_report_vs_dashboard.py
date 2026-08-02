# -*- coding: utf-8 -*-
"""
Auditoría comparativa entre el Reporte Diario Oficial (/reports/daily)
y el Dashboard General (/analytics/dashboard) para la fecha 31/07/2026.
"""
import asyncio
import sys
from datetime import datetime, date

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

async def main():
    from app.db import init_db, get_raw_db
    from app.services.analytics_v2_service import get_dashboard_metrics_v2
    from app.domain.models.sale import Sale
    from app.domain.models.sucursal import Sucursal

    await init_db()
    db = await get_raw_db()

    # Rango para el 31/07/2026 (Horario local Bolivia UTC-4 -> 2026-07-31 04:00:00 UTC a 2026-08-01 03:59:59 UTC)
    start_utc = datetime(2026, 7, 31, 4, 0, 0)
    end_utc   = datetime(2026, 8, 1, 3, 59, 59, 999999)

    print("==========================================================================")
    print("AUDITORÍA COMPARATIVA: REPORTE DIARIO OFICIAL VS DASHBOARD (31/07/2026)")
    print("==========================================================================")

    # 1. Cargar sucursales de la DB
    sucursales = await Sucursal.find(Sucursal.tenant_id == TENANT_ID).to_list()
    suc_map = {str(s.id): s.nombre for s in sucursales}
    
    # Sucursales objetivo
    hero_id = next((sid for sid, name in suc_map.items() if "hero" in name.lower()), None)
    reco_id = next((sid for sid, name in suc_map.items() if "recoleta" in name.lower()), None)
    cala_id = next((sid for sid, name in suc_map.items() if "calacoto" in name.lower()), None)

    # 2. CALCULAR SEGÚN EL REPORTE DIARIO OFICIAL (Sumatoria de sale.total donde anulada=False)
    sales_query = {
        "tenant_id": TENANT_ID,
        "created_at": {"$gte": start_utc, "$lte": end_utc},
        "anulada": False
    }

    all_sales = await db.sales.find(sales_query).to_list(10000)

    reporte_oficial = {"Heroínas": 0.0, "Recoleta": 0.0, "Calacoto": 0.0}
    
    for sdoc in all_sales:
        sid = str(sdoc.get("sucursal_id", ""))
        sname = suc_map.get(sid, sdoc.get("sucursal", ""))
        monto = float(str(sdoc.get("total", 0)))

        if "hero" in sname.lower():
            reporte_oficial["Heroínas"] += monto
        elif "recoleta" in sname.lower():
            reporte_oficial["Recoleta"] += monto
        elif "calacoto" in sname.lower():
            reporte_oficial["Calacoto"] += monto

    for k in reporte_oficial:
        reporte_oficial[k] = round(reporte_oficial[k], 2)

    total_oficial = round(sum(reporte_oficial.values()), 2)

    # 3. CONSULTAR EL DASHBOARD V2 (analytics_v2_service.py)
    res_dash = await get_dashboard_metrics_v2(
        tenant_id=TENANT_ID,
        start_date=start_utc,
        end_date=end_utc,
        time_range="yesterday"
    )

    overview = res_dash.get("overview", {})
    desglose = res_dash.get("desgloseSucursales", {})

    total_dash = round(float(overview.get("ventas_brutas", 0)), 2)

    dashboard_vals = {
        "Heroínas": round(float(desglose.get("Heroínas", {}).get("ingresos", 0)), 2),
        "Recoleta": round(float(desglose.get("Recoleta", {}).get("ingresos", 0)), 2),
        "Calacoto": round(float(desglose.get("Calacoto", {}).get("ingresos", 0)), 2),
    }

    # 4. TABLA COMPARATIVA AUDITORÍA
    print(f"\n{'SUCURSAL':<15} | {'REPORTE DIARIO OFICIAL':<25} | {'DASHBOARD GENERAL':<25} | {'ESTADO':<10}")
    print("-" * 85)

    all_passed = True
    for branch in ["Heroínas", "Recoleta", "Calacoto"]:
        val_oficial = reporte_oficial[branch]
        val_dash    = dashboard_vals[branch]
        diff = abs(val_oficial - val_dash)
        is_ok = diff < 0.01
        if not is_ok: all_passed = False

        print(f"{branch:<15} | Bs. {val_oficial:>20.2f} | Bs. {val_dash:>20.2f} | {'✅ PASS' if is_ok else '❌ FAIL'}")

    diff_tot = abs(total_oficial - total_dash)
    tot_ok = diff_tot < 0.01
    if not tot_ok: all_passed = False

    print("-" * 85)
    print(f"{'TOTAL GLOBAL':<15} | Bs. {total_oficial:>20.2f} | Bs. {total_dash:>20.2f} | {'✅ PASS' if tot_ok else '❌ FAIL'}")
    print("=" * 85)
    print(f"RESULTADO DE ALINEACIÓN: {'✅ 100% IDÉNTICO AL REPORTE OFICIAL' if all_passed else '❌ DIFERENCIA DETECTADA'}")

if __name__ == "__main__":
    asyncio.run(main())
