import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_colls():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    colls = await db.list_collection_names()
    print("COLLECTIONS:", colls)
    
    for c in colls:
        if "miembro" in c.lower() or "member" in c.lower() or "user" in c.lower() or "cliente" in c.lower() or "comunidad" in c.lower():
            docs = await db[c].find({"": [
                {"nombre": {"$regex": "sara", "$options": "i"}},
                {"nombre_completo": {"$regex": "sara", "$options": "i"}},
                {"full_name": {"$regex": "sara", "$options": "i"}},
                {"email": {"$regex": "sara", "$options": "i"}}
            ]}).to_list(100)
            if docs:
                print(f"FOUND IN {c}:")
                for d in docs:
                    print(d)

if __name__ == '__main__':
    asyncio.run(check_colls())
