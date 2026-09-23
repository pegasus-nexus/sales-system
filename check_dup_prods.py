import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    pipeline = [
        {"$match": {"tenant_id": tenant_id, "is_active": True}},
        {"$group": {
            "_id": {"$trim": {"input": {"$toLower": "$descripcion"}}},
            "count": {"$sum": 1},
            "docs": {"$push": {"id": "$_id", "desc": "$descripcion"}}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]
    
    duplicates = await db.products.aggregate(pipeline).to_list(None)
    
    print(f"Found {len(duplicates)} duplicated product names.")
    for dup in duplicates:
        print(f"Name: {dup['_id']} -> {dup['docs']}")

asyncio.run(get_db_info())
