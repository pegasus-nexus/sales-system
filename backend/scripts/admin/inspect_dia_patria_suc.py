import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime

async def inspect_patria_suc():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    start_date = datetime(2025, 8, 6, 0, 0, 0)
    end_date = datetime(2025, 8, 6, 23, 59, 59)

    pipeline = [
        {"$match": {
            "tenant_id": tenant_id,
            "fecha_transaccion": {"$gte": start_date, "$lte": end_date}
        }},
        {"$group": {
            "_id": "$sucursal",
            "total_bs": {"$sum": "$monto_total_bs"},
            "count": {"$sum": 1}
        }}
    ]

    res = await db.ventas_historicas_crudas.aggregate(pipeline).to_list(100)
    print("=== DESGLOSE POR SUCURSAL EL 06/08/2025 ===")
    for r in res:
        print(f"  • Sucursal: '{r['_id']}' | Total: Bs. {r['total_bs']:,.2f} | Docs: {r['count']}")

    # Muestra de documentos con monto > 0 para Heroínas
    pipeline_heroinas = [
        {"$match": {
            "tenant_id": tenant_id,
            "fecha_transaccion": {"$gte": start_date, "$lte": end_date},
            "sucursal": {"$regex": "Hero.*nas", "$options": "i"}
        }},
        {"$group": {
            "_id": "$nombre_producto",
            "total_bs": {"$sum": "$monto_total_bs"},
            "cant": {"$sum": "$cantidad_vendida"}
        }},
        {"$sort": {"total_bs": -1}}
    ]
    res_hero = await db.ventas_historicas_crudas.aggregate(pipeline_heroinas).to_list(10)
    print("\nTop 10 productos en Heroínas el 06/08/2025:")
    for p in res_hero:
        print(f"  • {p['_id']}: {p['cant']} un. -> Bs. {p['total_bs']:,.2f}")

if __name__ == '__main__':
    asyncio.run(inspect_patria_suc())
