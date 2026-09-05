import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def search_missing_sales():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    print("--- Last 20 sales in PROD ---")
    cursor = db.sales.find({}).sort("_id", -1).limit(20)
    
    total_anomalous = 0
    async for s in cursor:
        print(f"ID: {s.get('_id')}, CreatedAt: {s.get('created_at')}, Total: {s.get('total')}, Suc: {s.get('sucursal_id')}")
        
    print("\n--- Let's query by total ~31000 ---")
    cursor = db.sales.find({"total": {"": 30000}})
    async for s in cursor:
        print(f"LARGE SALE: ID: {s.get('_id')}, Date: {s.get('created_at')}, Total: {s.get('total')}")

if __name__ == '__main__':
    asyncio.run(search_missing_sales())
