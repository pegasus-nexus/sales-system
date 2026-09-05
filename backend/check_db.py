import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta

async def check_sales():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
    db = client["sales_system_dev"]
    
    print("--- Latest 10 sales ---")
    cursor = db.sales.find({}).sort("created_at", -1).limit(10)
    async for sale in cursor:
        print(f"Sale ID: {sale.get('_id')}, Date: {sale.get('created_at')}, Total: {sale.get('total')}, Sucursal: {sale.get('sucursal_id')}, Cajero: {sale.get('cajero_name')}")

    print("\n--- Sales Analytics for the last few days ---")
    cursor = db.sale_item_analytics.find({}).sort("sale_date", -1).limit(5)
    async for item in cursor:
        print(f"Analytics - Sale ID: {item.get('sale_id')}, Date: {item.get('sale_date')}, Qty: {item.get('cantidad')}, Sucursal: {item.get('sucursal_id')}")

if __name__ == '__main__':
    asyncio.run(check_sales())
