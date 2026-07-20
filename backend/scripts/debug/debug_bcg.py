"""
Script de diagnóstico BCG - ejecutar desde la carpeta backend con el venv activado:
  python debug_bcg.py
"""
import asyncio
from datetime import datetime, timezone

async def main():
    from app.db import get_raw_db
    db = await get_raw_db()

    print("\n====== DIAGNÓSTICO BCG ======\n")

    # 1. Ver colecciones disponibles
    collections = await db.list_collection_names()
    print(f"Colecciones en MongoDB: {collections}\n")

    # 2. Contar documentos en ventas_historicas_crudas
    total_vhc = await db.ventas_historicas_crudas.count_documents({})
    print(f"Total docs en ventas_historicas_crudas: {total_vhc}")

    # 3. Ver un ejemplo de documento
    sample = await db.ventas_historicas_crudas.find_one({})
    if sample:
        print(f"\nEjemplo de documento en ventas_historicas_crudas:")
        for k, v in sample.items():
            print(f"  {k}: {v} ({type(v).__name__})")
    else:
        print("NO HAY DOCUMENTOS en ventas_historicas_crudas!")

    # 4. Ver rangos de fechas disponibles
    pipeline_rango = [
        {"$group": {
            "_id": None,
            "min_fecha": {"$min": "$fecha_transaccion"},
            "max_fecha": {"$max": "$fecha_transaccion"},
            "total": {"$sum": 1}
        }}
    ]
    rango = await db.ventas_historicas_crudas.aggregate(pipeline_rango).to_list(1)
    if rango:
        r = rango[0]
        print(f"\nRango de fechas:")
        print(f"  Desde: {r.get('min_fecha')}")
        print(f"  Hasta: {r.get('max_fecha')}")
        print(f"  Total registros: {r.get('total')}")

    # 5. Ver tenant_ids únicos
    tenants = await db.ventas_historicas_crudas.distinct("tenant_id")
    print(f"\nTenant IDs únicos: {tenants}")

    # 6. Probar query BCG exacto para Enero 2026
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    end = datetime(2026, 1, 31, 23, 59, 59, tzinfo=timezone.utc)

    for tenant_id in (tenants or ["*"]):
        match = {"fecha_transaccion": {"$gte": start, "$lte": end}}
        if tenant_id != "*":
            match["tenant_id"] = tenant_id

        count = await db.ventas_historicas_crudas.count_documents(match)
        print(f"\n  Query Enero 2026 (tenant={tenant_id}): {count} docs")

    # 7. Ver algunos productos con fechas
    print("\nÚltimos 5 registros por fecha:")
    async for doc in db.ventas_historicas_crudas.find({}, {"nombre_producto": 1, "fecha_transaccion": 1, "tenant_id": 1, "monto_total_bs": 1}).sort("fecha_transaccion", -1).limit(5):
        print(f"  {doc.get('fecha_transaccion')} | {doc.get('nombre_producto')} | Bs {doc.get('monto_total_bs')} | tenant={doc.get('tenant_id')}")

    print("\n====== FIN DIAGNÓSTICO ======\n")

if __name__ == "__main__":
    asyncio.run(main())
