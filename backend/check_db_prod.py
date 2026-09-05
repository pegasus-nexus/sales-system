import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_sales():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    print("--- Latest 10 sales from PROD ---")
    cursor = db.sales.find({}).sort("created_at", -1).limit(10)
    async for sale in cursor:
        print(f"Sale ID: {sale.get('_id')}, Date: {sale.get('created_at')}, Total: {sale.get('total')}, Sucursal: {sale.get('sucursal_id')}")

if __name__ == '__main__':
    asyncio.run(check_sales())
