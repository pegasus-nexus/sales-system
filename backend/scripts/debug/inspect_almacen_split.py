import asyncio
from app.infrastructure.db import init_db
from app.domain.models.inventario import Inventario

async def main():
    await init_db()
    tenant_id = '69cd7f0a8f3f6866d4cfbb62'
    coll = Inventario.get_motor_collection()
    
    pipeline = [
        {"$match": {"tenant_id": tenant_id}},
        {
            "$group": {
                "_id": {
                    "sucursal_id": "$sucursal_id",
                    "producto_id": "$producto_id"
                },
                "count": {"$sum": 1},
                "docs": {
                    "$push": {
                        "id": "$_id",
                        "almacen_id": "$almacen_id",
                        "cantidad": "$cantidad"
                    }
                }
            }
        },
        {"$match": {"count": {"$gt": 1}}}
    ]
    splits = await coll.aggregate(pipeline).to_list(length=100)
    print(f"Total productos con múltiples registros de inventario en la misma sucursal: {len(splits)}")
    for s in splits[:10]:
        print(f"Suc: {s['_id']['sucursal_id']} | Prod: {s['_id']['producto_id']}")
        for d in s["docs"]:
            print(f"    Doc ID: {d['id']} | almacen_id: {d.get('almacen_id')} | cantidad: {d.get('cantidad')}")

if __name__ == "__main__":
    asyncio.run(main())
