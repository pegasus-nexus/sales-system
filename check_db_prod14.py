import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    cursor = db.products.find({
        "tenant_id": tenant_id,
        "descripcion": {"$regex": "TABLETA CHOC", "$options": "i"}
    })
    
    products = await cursor.to_list(length=100)
    for p in products:
        print(f"Product: {p.get('descripcion')} (ID: {p['_id']})")

asyncio.run(get_db_info())
