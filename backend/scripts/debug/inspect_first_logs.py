import asyncio
from app.infrastructure.db import init_db
from app.domain.models.inventario import InventoryLog

async def main():
    await init_db()
    tenant_id = '69cd7f0a8f3f6866d4cfbb62'
    coll = InventoryLog.get_motor_collection()
    
    # Check null stock_resultante
    null_sr = await coll.count_documents({
        "tenant_id": tenant_id,
        "stock_resultante": None
    })
    print(f"Logs con stock_resultante None: {null_sr}")
    
    # Check negative stock_resultante
    neg_sr = await coll.count_documents({
        "tenant_id": tenant_id,
        "stock_resultante": {"$lt": 0}
    })
    print(f"Logs con stock_resultante < 0: {neg_sr}")
    
    # Check logs where first log of a product has negative or weird stock_resultante
    pipeline = [
        {"$match": {"tenant_id": tenant_id}},
        {"$sort": {"created_at": 1}},
        {
            "$group": {
                "_id": {"sucursal_id": "$sucursal_id", "producto_id": "$producto_id"},
                "first_mov": {"$first": "$tipo_movimiento"},
                "first_cant": {"$first": "$cantidad_movida"},
                "first_res": {"$first": "$stock_resultante"},
                "first_date": {"$first": "$created_at"},
                "count": {"$sum": 1}
            }
        },
        {"$match": {"first_res": {"$lt": 0}}}
    ]
    neg_first = await coll.aggregate(pipeline).to_list(length=100)
    print(f"Productos cuya primera operación en una sucursal tuvo stock_resultante < 0: {len(neg_first)}")
    for nf in neg_first[:10]:
        print(f"  {nf['_id']} -> mov: {nf['first_mov']}, cant: {nf['first_cant']}, res: {nf['first_res']}, count: {nf['count']}")

if __name__ == "__main__":
    asyncio.run(main())
