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
        "$or": [
            {"tenant_id": tenant_id},
            {"tenant_id": None},
            {"tenant_id": {"$exists": False}}
        ],
        "sucursal": {"$regex": "Hero.*nas|Calacoto|Recoleta", "$options": "i"}
    }
    
    pipeline = [
        {"$match": match},
        {
            "$group": {
                "_id": "$nombre_producto",
                "costo": {"$sum": "$costo_total"}
            }
        }
    ]
    
    try:
        cursor = db["ventas_historicas_crudas"].aggregate(pipeline)
        async for doc in cursor:
            c = doc.get("costo", 0)
            if c:
                try:
                    float(c)
                except Exception as e:
                    print(f"FAILED TO CAST COSTO: {c} for product {doc['_id']}")
        print("Done checking costo.")
    except Exception as e:
        print(f"Aggregation failed: {e}")

if __name__ == "__main__":
    asyncio.run(run())
