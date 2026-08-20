import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def update_stock():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    db = AsyncIOMotorClient(uri)['sales_system_prod']
    # Let's find one product from Destacados categories: '69cd81b68f3f6866d4cfbb70', '69cd81b68f3f6866d4cfbb7b'
    prod = await db.products.find_one({'categoria_id': '69cd81b68f3f6866d4cfbb70'})
    if not prod:
        prod = await db.products.find_one({'categoria_id': '69cd81b68f3f6866d4cfbb7b'})
        
    if prod:
        print(f"Updating stock for product {prod['descripcion']}")
        await db.inventarios.update_one(
            {'producto_id': str(prod['_id']), 'sucursal_id': '69cd80098f3f6866d4cfbb64'},
            {'$set': {'cantidad': 10}},
            upsert=True
        )
        print("Updated")

if __name__ == '__main__':
    asyncio.run(update_stock())
