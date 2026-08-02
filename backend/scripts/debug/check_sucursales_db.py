# -*- coding: utf-8 -*-
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
    
    sucursales_hist = await db.ventas_historicas_crudas.distinct("sucursal", {"tenant_id": TENANT_ID})
    print("Distinct sucursales en ventas_historicas_crudas:", sucursales_hist)

    for year in [2024, 2025, 2026]:
        start = datetime(year, 1, 1)
        end = datetime(year, 12, 31, 23, 59, 59)
        pipeline = [
            {"$match": {"tenant_id": TENANT_ID, "fecha_transaccion": {"$gte": start, "$lte": end}, "estado": {"$ne": "anulado"}}},
            {"$group": {"_id": "$sucursal", "count": {"$sum": 1}, "total": {"$sum": {"$toDouble": "$monto_total_bs"}}}}
        ]
        res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(100)
        print(f"\n=== Año {year} ===")
        for r in res:
            print(f"  sucursal: '{r['_id']}' | docs: {r['count']} | total: {r['total']:.2f}")

    client.close()

if __name__ == "__main__":
    asyncio.run(run())
