# -*- coding: utf-8 -*-
"""
Investigación exacta del origen de las ventas del día de ayer (2026-07-31).
Audita ambas colecciones: 'sales' (POS en vivo) y 'ventas_historicas_crudas'.
"""
import asyncio
import sys
from datetime import datetime, date

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

def to_float(val):
    if val is None:
        return 0.0
    return float(str(val))

async def main():
    from app.db import init_db, get_raw_db

    await init_db()
    db = await get_raw_db()

    # Fecha de ayer: 2026-07-31 (America/La_Paz)
    start_utc = datetime(2026, 7, 31, 4, 0, 0)
    end_utc   = datetime(2026, 8, 1, 3, 59, 59, 999999)

    print("=" * 85)
    print("AUDITORÍA DE ORIGEN DE DATOS PARA AYER (2026-07-31)")
    print("Rango UTC:", start_utc, "a", end_utc)
    print("=" * 85)

    # 1. COLECCIÓN 'sales' (Ventas POS en vivo)
    print("\n--- 1. COLECCIÓN 'sales' (Ventas POS en vivo) ---")
    sales_match = {
        "tenant_id": TENANT_ID,
        "created_at": {"$gte": start_utc, "$lte": end_utc},
        "anulada": {"$ne": True},
        "estado": {"$ne": "anulado"}
    }
    
    sales_docs = await db.sales.find(sales_match).to_list(10000)
    print(f"Total documentos encontrados en 'sales' para ayer: {len(sales_docs)}")

    sales_by_suc = {}
    suc_name_map = {}
    
    async for s in db.sucursales.find({"tenant_id": TENANT_ID}):
        suc_name_map[str(s["_id"])] = s.get("nombre", "Sin nombre")

    for sdoc in sales_docs:
        sid = str(sdoc.get("sucursal_id", ""))
        sname = sdoc.get("sucursal") or suc_name_map.get(sid, sid)
        monto = to_float(sdoc.get("total", 0))
        sales_by_suc[sname] = sales_by_suc.get(sname, 0.0) + monto

    for sname, total in sales_by_suc.items():
        print(f"  Sucursal '{sname}': Bs. {total:,.2f}")

    # 2. COLECCIÓN 'ventas_historicas_crudas'
    print("\n--- 2. COLECCIÓN 'ventas_historicas_crudas' ---")
    hist_start = datetime(2026, 7, 31, 0, 0, 0)
    hist_end   = datetime(2026, 7, 31, 23, 59, 59, 999999)

    hist_match = {
        "tenant_id": TENANT_ID,
        "fecha_transaccion": {"$gte": hist_start, "$lte": hist_end},
        "estado": {"$ne": "anulado"}
    }

    hist_docs = await db.ventas_historicas_crudas.find(hist_match).to_list(10000)
    print(f"Total documentos encontrados en 'ventas_historicas_crudas' para ayer: {len(hist_docs)}")

    hist_by_suc = {}
    for hdoc in hist_docs:
        sname = hdoc.get("sucursal", "Sin sucursal")
        monto = to_float(hdoc.get("monto_total_bs", 0))
        hist_by_suc[sname] = hist_by_suc.get(sname, 0.0) + monto

    for sname, total in hist_by_suc.items():
        print(f"  Sucursal '{sname}': Bs. {total:,.2f}")

    # 3. VERIFICAR SERVICIO DE DASHBOARD (analytics_v2_service)
    print("\n--- 3. EJECUCIÓN DE get_dashboard_metrics_v2 EN BACKEND ---")
    from app.services.analytics_v2_service import get_dashboard_metrics_v2
    
    res = await get_dashboard_metrics_v2(
        tenant_id=TENANT_ID,
        start_date=start_utc,
        end_date=end_utc,
        time_range="yesterday"
    )

    overview = res.get("overview", {})
    desglose = res.get("desgloseSucursales", {})

    print(f"Ventas Brutas Overview: Bs. {overview.get('ventas_brutas', 0):,.2f}")
    print("Desglose por Sucursal en Dashboard:")
    for suc_k, d in desglose.items():
        print(f"  {suc_k}: Ingresos = Bs. {d.get('ingresos', 0):,.2f} | Comision = Bs. {d.get('comision', 0):,.2f} | Margen Retail = Bs. {d.get('margenRetail', 0):,.2f} | Margen Neto = Bs. {d.get('margenNeto', 0):,.2f}")

if __name__ == "__main__":
    asyncio.run(main())
