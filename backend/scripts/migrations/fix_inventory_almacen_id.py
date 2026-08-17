import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_docs():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    # Update missing almacen_id to 'default'
    result = await db.inventario.update_many(
        {"almacen_id": {"$exists": False}},
        {"$set": {"almacen_id": "default"}}
    )
    print(f"Updated {result.modified_count} inventory records to have almacen_id='default'")

if __name__ == '__main__':
    asyncio.run(check_docs())
