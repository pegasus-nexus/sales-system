import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_clusters():
    uri1 = 'mongodb+srv://admin:VigKJWIIMV6CXKsH@salessystem.q281a1p.mongodb.net/?retryWrites=true&w=majority&appName=SalesSystem'
    client1 = AsyncIOMotorClient(uri1)
    db1 = client1['SalesSystem']
    
    user1 = await db1.users.find_one({"username": "jhesica.bohorquez.peredo"})
    print("Old Cluster (SalesSystem) User:", user1 is not None)
    
    uri2 = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client2 = AsyncIOMotorClient(uri2)
    db2 = client2['sales_system_prod']
    
    user2 = await db2.users.find_one({"username": "jhesica.bohorquez.peredo"})
    print("New Cluster (sales_system_prod) User:", user2 is not None)

if __name__ == '__main__':
    asyncio.run(check_clusters())
