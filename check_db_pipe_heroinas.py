import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    sucursal_id = "69cd80098f3f6866d4cfbb64" # Heroinas
    
    pipeline = [
        {"$match": {"tenant_id": tenant_id, "is_active": True, "_id": ObjectId("6aac19c8231eec6c5b7bb132")}},
        {"$lookup": {
            "from": "inventario",
            "let": {"pid": {"$toString": "$_id"}},
            "pipeline": [
                {"$match": {
                    "$expr": {"$eq": ["$producto_id", "$$pid"]},
                    "tenant_id": tenant_id,
                    "sucursal_id": sucursal_id,
                    "$or": [{"almacen_id": "default"}, {"almacen_id": {"$exists": False}}]
                }}
            ],
            "as": "inventory"
        }},
        {"$unwind": {"path": "$inventory", "preserveNullAndEmptyArrays": True}}
    ]
    
    cursor = db.products.aggregate(pipeline)
    results = await cursor.to_list(length=100)
    for r in results:
        inv = r.get("inventory", {})
        print(f"Result -> Product ID: {r['_id']}, Inv_Almacen: {inv.get('almacen_id')}, Cantidad: {inv.get('cantidad')}")

asyncio.run(get_db_info())
