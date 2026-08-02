# -*- coding: utf-8 -*-
"""
Búsqueda global exhaustiva de los montos:
1146.60, 890.00, 3278.52, 5315.14
en todas las colecciones y rangos de fechas (horas locales Bolivia vs UTC).
"""
import asyncio
import sys
from datetime import datetime, date

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

async def main():
    from app.db import init_db, get_raw_db

    await init_db()
    db = await get_raw_db()

    print("==========================================================================")
    print("BÚSQUEDA GLOBAL DE MONTOS: Calacoto 1146.60 | Recoleta 890 | Heroínas 3278.52")
    print("==========================================================================")

    # 1. Probar agrupaciones por fecha local en 'sales'
    pipeline_sales_local = [
        {"$match": {"tenant_id": TENANT_ID, "anulada": {"$ne": True}}},
        {"$project": {
            "monto": {"$toDouble": "$total"},
            "sucursal_id": 1,
            "sucursal": {"$ifNull": ["$sucursal", "Sin Sucursal"]},
            "fecha_local": {
                "$dateToString": {
                    "format": "%Y-%m-%d",
                    "date": "$created_at",
                    "timezone": "America/La_Paz"
                }
            }
        }},
        {"$group": {
            "_id": {"fecha": "$fecha_local", "sucursal": "$sucursal"},
            "total": {"$sum": "$monto"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.fecha": -1, "_id.sucursal": 1}}
    ]

    res_sales = await db.sales.aggregate(pipeline_sales_local).to_list(1000)
    print("\n--- AGRUPACIÓN POR FECHA LOCAL (America/La_Paz) EN 'sales' ---")
    by_fecha_sales = {}
    for r in res_sales:
        f = r["_id"].get("fecha", "Sin fecha")
        s = r["_id"].get("sucursal", "Sin sucursal")
        tot = round(r["total"], 2)
        by_fecha_sales.setdefault(f, {})[s] = tot

    for f, sucs in list(by_fecha_sales.items())[:15]:
        tot_dia = sum(sucs.values())
        print(f"Fecha Local: {f} | TOTAL DAY: Bs. {tot_dia:,.2f}")
        for s, tot in sucs.items():
            print(f"   - {s}: Bs. {tot:,.2f}")

    # 2. Probar agrupaciones en 'ventas_historicas_crudas' por fecha
    pipeline_hist = [
        {"$match": {"tenant_id": TENANT_ID, "estado": {"$ne": "anulado"}}},
        {"$project": {
            "monto": {"$toDouble": "$monto_total_bs"},
            "sucursal": {"$ifNull": ["$sucursal", "Sin sucursal"]},
            "fecha": {
                "$dateToString": {
                    "format": "%Y-%m-%d",
                    "date": "$fecha_transaccion"
                }
            }
        }},
        {"$group": {
            "_id": {"fecha": "$fecha", "sucursal": "$sucursal"},
            "total": {"$sum": "$monto"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.fecha": -1, "_id.sucursal": 1}}
    ]

    res_hist = await db.ventas_historicas_crudas.aggregate(pipeline_hist).to_list(1000)
    print("\n--- AGRUPACIÓN POR FECHA EN 'ventas_historicas_crudas' ---")
    by_fecha_hist = {}
    for r in res_hist:
        f = r["_id"].get("fecha", "Sin fecha")
        s = r["_id"].get("sucursal", "Sin sucursal")
        tot = round(r["total"], 2)
        by_fecha_hist.setdefault(f, {})[s] = tot

    for f, sucs in list(by_fecha_hist.items())[:15]:
        tot_dia = sum(sucs.values())
        print(f"Fecha Histórica: {f} | TOTAL DAY: Bs. {tot_dia:,.2f}")
        for s, tot in sucs.items():
            print(f"   - {s}: Bs. {tot:,.2f}")

if __name__ == "__main__":
    asyncio.run(main())
