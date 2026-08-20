import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_dupes():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    users = await db.users.find({'username': 'jhesica.bohorquez.peredo'}).to_list(None)
    print("Number of dupes:", len(users))
    for u in users:
        print(u['_id'])

if __name__ == '__main__':
    asyncio.run(check_dupes())
