import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def fix_cat_schema():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    
    print("Corrigiendo campo en categorias...")
    res = await db.categories.update_many(
        {"nombre": {"$exists": True}},
        [{"$set": {"name": "$nombre", "description": "$descripcion"}}, 
         {"$unset": ["nombre", "descripcion"]}]
    )
    print(f"Modificadas {res.modified_count} categorias.")

if __name__ == '__main__':
    asyncio.run(fix_cat_schema())
