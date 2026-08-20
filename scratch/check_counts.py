import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    cols = await db.web_collections.find({'tenant_id': '69cd7f0a8f3f6866d4cfbb62'}).to_list(None)
    print(f'Collections: {len(cols)}')
    cats = await db.categories.find({'tenant_id': '69cd7f0a8f3f6866d4cfbb62'}).to_list(None)
    print(f'Categories: {len(cats)}')
    prods = await db.products.find({'tenant_id': '69cd7f0a8f3f6866d4cfbb62'}).to_list(None)
    print(f'Products (total): {len(prods)}')
    invs = await db.inventarios.find({'cantidad': {'$gt': 0}}).to_list(None)
    print(f'Inventarios > 0: {len(invs)}')

if __name__ == '__main__':
    asyncio.run(test())
