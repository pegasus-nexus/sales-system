import asyncio
import httpx
import os

async def fetch_inventario():
    # Unfortunately we don't have the auth token. We can bypass by calling the DB directly with the aggregation pipeline.
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    sucursal_id = "69dfa560bb46ddb1ff3d5af2" # Supermercados
    
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
        {"$match": {"descripcion": {"$regex": "MARACUY", "$options": "i"}}}
    ]
    
    cursor = db.products.aggregate(pipeline)
    results = await cursor.to_list(length=100)
    for r in results:
        inv = r.get("inventory", {})
        print(f"Product: {r.get('descripcion')} | Inv_Almacen: {inv.get('almacen_id')} | Cantidad: {inv.get('cantidad')}")

asyncio.run(fetch_inventario())
