import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    sale = await db.sales.find_one({}, sort=[("created_at", -1)])
    if sale:
        print(f"Ultima venta fecha: {sale.get('created_at')} (tipo {type(sale.get('created_at'))})")
        print(f"Timezone info: {sale.get('created_at').tzinfo if hasattr(sale.get('created_at'), 'tzinfo') else 'none'}")
        
if __name__ == '__main__':
    asyncio.run(check_db())
