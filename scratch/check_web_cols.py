import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_web_collection():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    cols = await db.web_collections.find({'tenant_id': '69cd7f0a8f3f6866d4cfbb62'}).to_list(None)
    print(cols)

if __name__ == '__main__':
    asyncio.run(check_web_collection())
