import asyncio
import os
import sys
from datetime import date
from bson import ObjectId

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db
from app.utils.date_utils import get_day_range_bolivia

async def main():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    sucursales = await db.sucursales.find({"tenant_id": tenant_id}).to_list(100)
    print("Sucursales registradas en DB:")
    for s in sucursales:
        print(f"  - ID: {s['_id']} | Nombre: {s.get('nombre')}")

    start_utc, end_utc = get_day_range_bolivia("2026-08-20")

    # Match heroínas sales
    hero_ids = [s["_id"] for s in sucursales if "hero" in s.get("nombre", "").lower()]
    hero_id_strs = [str(s["_id"]) for s in sucursales if "hero" in s.get("nombre", "").lower()]

    match_stage = {
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc, "$lte": end_utc},
        "anulada": {"$ne": True},
        "$or": [
            {"sucursal_id": {"$in": hero_ids + hero_id_strs}},
            {"sucursal_nombre": {"$regex": "Hero", "$options": "i"}}
        ]
    }

    pipeline = [
        {"$match": match_stage},
        {
            "$project": {
                "monto_neto": {"$toDouble": "$total"},
                "hour": {"$hour": {"date": "$created_at", "timezone": "-04:00"}}
            }
        },
        {
            "$group": {
                "_id": "$hour",
                "total": {"$sum": "$monto_neto"}
            }
        },
        {"$sort": {"_id": 1}}
    ]

    res = await db.sales.aggregate(pipeline).to_list(100)
    print(f"\nDesglose horario 20/08/2026 para Heroínas ({sum(r['total'] for r in res):.2f} Bs.):")
    for r in res:
        print(f"  {r['_id']:02d}:00 -> Bs. {r['total']:>7.2f}")

asyncio.run(main())
