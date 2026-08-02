# -*- coding: utf-8 -*-
"""
Búsqueda de la combinación exacta de montos:
Global: 5,315.14 Bs | Calacoto: 1,146.60 Bs | Recoleta: 890.00 Bs | Heroínas: 3,278.52 Bs
"""
import asyncio
import sys
from datetime import datetime, date, timedelta

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

    print("=" * 85)
    print("BÚSQUEDA DE MONTOS SOLICITADOS (Calacoto: 1146.60 | Recoleta: 890 | Heroínas: 3278.52)")
    print("=" * 85)

    # Probar diferentes fechas recientes (2026-07-28 a 2026-08-01) en sales incluyendo anuladas y sin filtrar por estado
    for days_back in range(0, 7):
        target_date = date(2026, 8, 1) - timedelta(days=days_back)
        start_utc = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
        end_utc   = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59)

        # 1. Sin filtro de estado ni anulada (Todas las transacciones en 'sales')
        all_sales = await db.sales.find({
            "tenant_id": TENANT_ID,
            "created_at": {"$gte": start_utc, "$lte": end_utc}
        }).to_list(10000)

        by_suc_all = {}
        by_suc_active = {}

        suc_name_map = {}
        async for s in db.sucursales.find({"tenant_id": TENANT_ID}):
            suc_name_map[str(s["_id"])] = s.get("nombre", "Sin nombre")

        for sdoc in all_sales:
            sid = str(sdoc.get("sucursal_id", ""))
            sname = sdoc.get("sucursal") or suc_name_map.get(sid, sid)
            monto = to_float(sdoc.get("total", 0))

            by_suc_all[sname] = by_suc_all.get(sname, 0.0) + monto
            if not sdoc.get("anulada") and sdoc.get("estado") != "anulado":
                by_suc_active[sname] = by_suc_active.get(sname, 0.0) + monto

        tot_all = sum(by_suc_all.values())
        tot_act = sum(by_suc_active.values())

        print(f"\n[FECHA UTC: {target_date}]")
        print(f"  TOTAL TODAS (Inc. Anuladas): Bs. {tot_all:,.2f}")
        for k, v in by_suc_all.items():
            print(f"    - {k}: Bs. {v:,.2f}")
        
        print(f"  TOTAL VÁLIDAS (Sin Anuladas): Bs. {tot_act:,.2f}")
        for k, v in by_suc_active.items():
            print(f"    - {k}: Bs. {v:,.2f}")

if __name__ == "__main__":
    asyncio.run(main())
