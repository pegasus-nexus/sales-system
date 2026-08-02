# -*- coding: utf-8 -*-
"""
Análisis detallado de cómo se cargaron los datos de Calacoto y Recoleta en la colección `ventas_historicas_crudas`.
"""
import asyncio
import sys
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"
MONGO_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority"

async def run():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["sales_system_prod"]

    start = datetime(2025, 8, 1, 0, 0, 0)
    end = datetime(2025, 8, 1, 23, 59, 59, 999999)

    for suc in ["Calacoto", "Recoleta"]:
        docs = await db.ventas_historicas_crudas.find({
            "tenant_id": TENANT_ID,
            "fecha_transaccion": {"$gte": start, "$lte": end},
            "estado": {"$ne": "anulado"},
            "sucursal": {"$regex": f"^{suc}$", "$options": "i"}
        }).to_list(10)

        print(f"\n=== SUCURSAL: {suc} ===")
        for d in docs:
            # Extraer timestamp de inserción del ObjectId
            created_at = d["_id"].generation_time
            print(f"  ID: {d['_id']} | Inserción en BD: {created_at} | Transacción: {d.get('fecha_transaccion')} | Sucursal: '{d.get('sucursal')}' | Monto: {d.get('monto_total_bs')}")

    # Totales generales de la colección por sucursal
    pipeline = [
        {"$match": {"tenant_id": TENANT_ID, "estado": {"$ne": "anulado"}}},
        {"$group": {
            "_id": "$sucursal",
            "count": {"$sum": 1},
            "total_monto": {"$sum": {"$toDouble": "$monto_total_bs"}},
            "fechas_min": {"$min": "$fecha_transaccion"},
            "fechas_max": {"$max": "$fecha_transaccion"}
        }}
    ]
    res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(10)
    print("\n========================================================")
    print("RESUMEN DE TODA LA COLECCIÓN ventas_historicas_crudas POR SUCURSAL")
    print("========================================================")
    for r in res:
        print(f"Sucursal: '{r['_id']:<10}' | Docs: {r['count']:>6} | Total Monto: {r['total_monto']:>12.2f} Bs | Desde: {r['fechas_min']} Hasta: {r['fechas_max']}")

    client.close()

if __name__ == "__main__":
    asyncio.run(run())
