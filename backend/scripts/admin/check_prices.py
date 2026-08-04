import asyncio
import pprint
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    print("Sample product:")
    prod = await db.products.find_one()
    import pprint
    pprint.pprint(prod)
    
asyncio.run(main())
