# -*- coding: utf-8 -*-
"""
Prueba de verificación de la causa raíz de la diferencia entre 3,278.52 y 2,294.67.
Compara la suma con $unwind $items vs suma directa de $total en 'sales'.
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

    start_utc = datetime(2026, 7, 31, 4, 0, 0)
    end_utc   = datetime(2026, 8, 1, 3, 59, 59, 999999)

    print("=" * 85)
    print("DEMOSTRACIÓN DE CAUSA RAÍZ EN analytics_v2_service.py (2026-07-31)")
    print("=" * 85)

    # 1. Pipeline V2 actual con $unwind $items y $items.subtotal
    pipeline_v2_unwind = [
        {"$match": {
            "tenant_id": TENANT_ID,
            "created_at": {"$gte": start_utc, "$lte": end_utc},
            "anulada": {"$ne": True},
            "estado": {"$ne": "anulado"}
        }},
        {"$unwind": {"path": "$items", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "monto": {"$toDouble": {"$ifNull": ["$items.subtotal", "$total", 0]}},
            "sucursal_id": 1
        }},
        {"$group": {
            "_id": "$sucursal_id",
            "total_v2": {"$sum": "$monto"}
        }}
    ]

    res_unwind = await db.sales.aggregate(pipeline_v2_unwind).to_list(100)

    # Cargar sucursales
    suc_map = {}
    async for s in db.sucursales.find({"tenant_id": TENANT_ID}):
        suc_map[str(s["_id"])] = s.get("nombre", "")

    print("\n--- 1. SUMATORIA CON $unwind $items y $items.subtotal (V2 ACTUAL) ---")
    tot_unwind_global = 0.0
    for r in res_unwind:
        sid = str(r["_id"])
        sname = suc_map.get(sid, sid)
        val = round(r["total_v2"], 2)
        tot_unwind_global += val
        print(f"  {sname:<25}: Bs. {val:>10.2f}")
    print(f"  {'TOTAL GLOBAL V2 ACTUAL':<25}: Bs. {tot_unwind_global:>10.2f}")

    # 2. Sumatoria directa del campo $total por ticket (VENTAS REALES POS)
    pipeline_direct_total = [
        {"$match": {
            "tenant_id": TENANT_ID,
            "created_at": {"$gte": start_utc, "$lte": end_utc},
            "anulada": {"$ne": True},
            "estado": {"$ne": "anulado"}
        }},
        {"$project": {
            "monto": {"$toDouble": "$total"},
            "sucursal_id": 1
        }},
        {"$group": {
            "_id": "$sucursal_id",
            "total_real": {"$sum": "$monto"}
        }}
    ]

    res_direct = await db.sales.aggregate(pipeline_direct_total).to_list(100)
    print("\n--- 2. SUMATORIA DIRECTA DEL CAMPO $total POR TICKET (POS REAL CORREGIDO) ---")
    tot_direct_global = 0.0
    for r in res_direct:
        sid = str(r["_id"])
        sname = suc_map.get(sid, sid)
        val = round(r["total_real"], 2)
        tot_direct_global += val
        print(f"  {sname:<25}: Bs. {val:>10.2f}")
    print(f"  {'TOTAL GLOBAL REAL POS':<25}: Bs. {tot_direct_global:>10.2f}")

if __name__ == "__main__":
    asyncio.run(main())
