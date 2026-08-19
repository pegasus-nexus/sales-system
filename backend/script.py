import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_venta():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    venta = await db.ventas.find_one({}, sort=[("created_at", -1)])
    if venta:
        print(f"Ultima venta fecha: {venta['created_at']} (tipo {type(venta['created_at'])})")
    
if __name__ == '__main__':
    asyncio.run(get_venta())
