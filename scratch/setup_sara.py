import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
from motor.motor_asyncio import AsyncIOMotorClient
from app.auth import get_password_hash

async def setup_sara():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    # 1. Encontrar Sucursal Heroinas
    sucursal = await db.sucursales.find_one({"nombre": {"$regex": "Heroinas", "$options": "i"}})
    if not sucursal:
        print("ERROR: No se encontró la sucursal Heroinas.")
        return
        
    sucursal_id = str(sucursal['_id'])
    print(f"Sucursal Heroinas ID: {sucursal_id}")
    
    # 2. Buscar si existe Sara
    username = "sara.lazarte.ramirez"
    plain_password = "#Sara.15La334%Ram324"
    hashed_pwd = get_password_hash(plain_password)
    
    existing_user = await db.users.find_one({"username": username})
    
    if existing_user:
        print(f"La cajera {username} YA EXISTE. Actualizando contraseña y sucursal...")
        await db.users.update_one(
            {"_id": existing_user["_id"]},
            {"$set": {
                "hashed_password": hashed_pwd,
                "sucursal_id": sucursal_id,
                "role": "CAJERO",
                "full_name": "Sara Lazarte Ramirez",
                "is_active": True
            }}
        )
        print("Usuario actualizado correctamente.")
    else:
        print(f"La cajera {username} NO EXISTE. Creándola...")
        import uuid
        from datetime import datetime
        # We use standard insert structure
        new_user = {
            "tenant_id": tenant_id,
            "username": username,
            "email": username + "@taboada.bo", # default dummy email
            "hashed_password": hashed_pwd,
            "full_name": "Sara Lazarte Ramirez",
            "role": "CAJERO",
            "is_active": True,
            "is_superuser": False,
            "sucursal_id": sucursal_id,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(new_user)
        print("Usuario creado correctamente.")

if __name__ == '__main__':
    asyncio.run(setup_sara())
