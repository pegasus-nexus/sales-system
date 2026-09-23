import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    cursor = db.users.find({"tenant_id": tenant_id, "username": {"$regex": "sara", "$options": "i"}})
    
    items = await cursor.to_list(length=10)
    for i in items:
        print(f"User: {i.get('username')} | Role: {i.get('role')} | Sucursal ID: {i.get('sucursal_id')}")

asyncio.run(get_db_info())
