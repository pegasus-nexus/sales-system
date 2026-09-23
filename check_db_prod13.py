import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    sucursal_id = "69dfa560bb46ddb1ff3d5af2" # Supermercados
    
    # We want to mimic get_inventario aggregation.
    pipeline = [
        {"$match": {"tenant_id": tenant_id, "is_active": True}},
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
        {"$unwind": {"path": "$inventory", "preserveNullAndEmptyArrays": True}},
        # Sort and limit
        {"$sort": {"_id": -1}},
        {"$skip": 0},
        {"$limit": 1000}
    ]
    
    cursor = db.products.aggregate(pipeline)
    results = await cursor.to_list(length=1000)
    
    for r in results:
        inv = r.get("inventory", {})
        if "MARACUY" in r.get("descripcion", "").upper():
            print(f"Product in API results: {r.get('descripcion')} | Inv_Almacen: {inv.get('almacen_id')} | Cantidad: {inv.get('cantidad')} | Product ID: {r['_id']}")

asyncio.run(get_db_info())
