import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    client = AsyncIOMotorClient('mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority')
    db = client['sales_system_prod']
    prods = await db.products.find({}).to_list(10)
    for p in prods:
        print(f"Producto: {p.get('nombre')} | Tenant: {p.get('tenant_id')}")

if __name__ == '__main__':
    asyncio.run(test())
