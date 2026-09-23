import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    cursor = db.products.find({
        "tenant_id": tenant_id,
        "descripcion": {"$regex": "MARACU", "$options": "i"}
    })
    
    items = await cursor.to_list(length=10)
    for i in items:
        print(f"Product: {i.get('descripcion')} | ID: {i['_id']} | IsActive: {i.get('is_active')}")

asyncio.run(get_db_info())
