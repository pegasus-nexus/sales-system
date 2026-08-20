import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def copy_to_dev():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db_prod = client['sales_system_prod']
    db_dev = client['sales_system_dev']
    
    jhesica = await db_prod.users.find_one({"username": "jhesica.bohorquez.peredo"})
    if jhesica:
        # Check if exists in dev
        exists = await db_dev.users.find_one({"username": "jhesica.bohorquez.peredo"})
        if not exists:
            await db_dev.users.insert_one(jhesica)
            print("Copiada a DEV.")
        else:
            await db_dev.users.replace_one({"username": "jhesica.bohorquez.peredo"}, jhesica)
            print("Actualizada en DEV.")

if __name__ == '__main__':
    asyncio.run(copy_to_dev())
