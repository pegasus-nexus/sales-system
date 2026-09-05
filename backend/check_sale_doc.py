import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import pprint
from bson.objectid import ObjectId

async def check():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    sale = await db.sales.find_one({"_id": ObjectId("6a94bd08f4996de97ff7c908")})
    pprint.pprint(sale)

if __name__ == '__main__':
    asyncio.run(check())
