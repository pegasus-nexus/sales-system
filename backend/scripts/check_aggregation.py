import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    start = datetime.fromisoformat("2026-06-01T00:00:00.000Z").replace(tzinfo=timezone.utc)
    end = datetime.fromisoformat("2026-06-30T23:59:59.999Z").replace(tzinfo=timezone.utc)
    
    match = {
        "fecha_transaccion": {"$gte": start, "$lte": end},
        "tenant_id": tenant_id,
        "sucursal": {"$regex": "Hero.*nas|Calacoto|Recoleta", "$options": "i"}
    }
    
    pipeline = [
        {"$match": match},
        {
            "$project": {
                "nombre_producto": 1,
                "monto_total_bs": 1,
                "cantidad_vendida": 1,
                "costo_total": 1,
                "categoria": 1
            }
        },
        {
            "$group": {
                "_id": "$nombre_producto",
                "nombre": {"$first": "$nombre_producto"},
                "categoria": {"$first": "$categoria"},
                "ventas": {"$sum": "$monto_total_bs"},
                "cantidad": {"$sum": {"$toDouble": "$cantidad_vendida"}},
                "costo": {"$sum": "$costo_total"}
            }
        }
    ]
    
    print("Running aggregation pipeline for June on ventas_historicas_crudas...")
    try:
        cursor = db["ventas_historicas_crudas"].aggregate(pipeline)
        docs = await cursor.to_list(None)
        print(f"Success! Found {len(docs)} products.")
        if docs:
            print("First 5 products:")
            for d in docs[:5]:
                print(d)
    except Exception as e:
        import traceback
        print(f"Aggregation failed!")
        print(repr(e))
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run())
