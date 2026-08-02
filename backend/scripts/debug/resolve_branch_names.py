# -*- coding: utf-8 -*-
"""
Auditoría exacta con join de sucursales por sucursal_id en colección sales.
"""
import asyncio
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

async def main():
    from app.db import init_db, get_raw_db

    await init_db()
    db = await get_raw_db()

    print("==========================================================================")
    print("AUDITORÍA DE VENTAS POR SUCURSAL CON RESOLUCIÓN DE SUCURSAL_ID")
    print("==========================================================================")

    # Cargar mapa de sucursales
    suc_map = {}
    async for s in db.sucursales.find({"tenant_id": TENANT_ID}):
        sid = str(s["_id"])
        suc_map[sid] = s.get("nombre", "Sin Nombre")
        print(f"Sucursal en DB: ID='{sid}' -> Nombre='{s.get('nombre')}'")

    pipeline = [
        {"$match": {"tenant_id": TENANT_ID, "anulada": {"$ne": True}}},
        {"$project": {
            "monto": {"$toDouble": "$total"},
            "sucursal_id_str": {"$toString": "$sucursal_id"},
            "sucursal_text": "$sucursal",
            "fecha_local": {
                "$dateToString": {
                    "format": "%Y-%m-%d",
                    "date": "$created_at",
                    "timezone": "America/La_Paz"
                }
            }
        }},
        {"$group": {
            "_id": {"fecha": "$fecha_local", "suc_id": "$sucursal_id_str", "suc_text": "$sucursal_text"},
            "total": {"$sum": "$monto"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.fecha": -1}}
    ]

    res = await db.sales.aggregate(pipeline).to_list(1000)

    by_day = {}
    for r in res:
        f = r["_id"]["fecha"]
        sid = r["_id"].get("suc_id")
        stext = r["_id"].get("suc_text")
        
        name = suc_map.get(sid) or stext or "Desconocida"
        tot = round(r["total"], 2)
        
        by_day.setdefault(f, {})[name] = by_day.setdefault(f, {}).get(name, 0.0) + tot

    for f, sucs in list(by_day.items())[:10]:
        tot_dia = sum(sucs.values())
        print(f"\nFecha Local: {f} | TOTAL DEL DÍA: Bs. {tot_dia:,.2f}")
        for s, tot in sucs.items():
            print(f"   - {s:<25}: Bs. {tot:>10.2f}")

if __name__ == "__main__":
    asyncio.run(main())
