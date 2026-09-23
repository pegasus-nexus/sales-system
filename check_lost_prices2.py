import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    ids = ["6aac195b231eec6c5b7bb12e", "6aac19c8231eec6c5b7bb132", "6aac1702231eec6c5b7bb119", "6aac18d8231eec6c5b7bb121", "6aac1918231eec6c5b7bb12c"]
    
    from bson.objectid import ObjectId
    cursor = db.products.find({"_id": {"$in": [ObjectId(id) for id in ids]}})
    
    items = await cursor.to_list(length=10)
    for i in items:
        print(f"Product: {i.get('descripcion')} | ID: {i['_id']}")

asyncio.run(get_db_info())
