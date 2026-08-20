import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def fix_jhesica_email():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    
    for db_name in ['sales_system_prod', 'sales_system_dev']:
        db = client[db_name]
        
        # We unset the invalid email since the model expects EmailStr or None
        res = await db.users.update_one(
            {"username": "jhesica.bohorquez.peredo"},
            {"$set": {"email": None}}
        )
        if res.modified_count > 0:
            print(f"Correo arreglado en {db_name}")

if __name__ == '__main__':
    asyncio.run(fix_jhesica_email())
