import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    print("--- Analytics for Sale 6a94bd08f4996de97ff7c908 ---")
    cursor = db.sale_item_analytics.find({"sale_id": "6a94bd08f4996de97ff7c908"})
    async for a in cursor:
        print(a.get("sale_date"))
        
    print("--- CajaMovimiento for Sale 6a94bd08f4996de97ff7c908 ---")
    cursor = db.caja_movimientos.find({"sale_id": "6a94bd08f4996de97ff7c908"})
    async for a in cursor:
        print(a.get("fecha"))

if __name__ == '__main__':
    asyncio.run(check())
