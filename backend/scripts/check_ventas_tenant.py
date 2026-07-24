import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    doc = await db["ventas_historicas_crudas"].find_one({"tenant_id": {"$exists": True, "$ne": None}})
    print(f"Sample doc with tenant_id: {doc}")
    
    count_str = await db["ventas_historicas_crudas"].count_documents({"tenant_id": "69cd7f0a8f3f6866d4cfbb62"})
    print(f"Docs with string tenant_id: {count_str}")
    
    from bson import ObjectId
    count_obj = await db["ventas_historicas_crudas"].count_documents({"tenant_id": ObjectId("69cd7f0a8f3f6866d4cfbb62")})
    print(f"Docs with ObjectId tenant_id: {count_obj}")
    
    count_missing = await db["ventas_historicas_crudas"].count_documents({"$or": [{"tenant_id": None}, {"tenant_id": {"$exists": False}}]})
    print(f"Docs with missing/null tenant_id: {count_missing}")
    
if __name__ == "__main__":
    asyncio.run(run())
