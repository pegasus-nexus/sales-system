import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    s_str = await db["sucursales"].find_one({"tenant_id": tenant_id})
    print(f"Sucursal with str tenant_id: {s_str}")
    
    from bson import ObjectId
    s_obj = await db["sucursales"].find_one({"tenant_id": ObjectId(tenant_id)})
    print(f"Sucursal with ObjectId tenant_id: {s_obj}")

if __name__ == "__main__":
    asyncio.run(run())
