import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
from motor.motor_asyncio import AsyncIOMotorClient
from app.auth import get_password_hash

async def setup_gabriel():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    # 1. Encontrar Sucursal
    sucursal = await db.sucursales.find_one({"nombre": {"$regex": "Dsitribucion La Paz", "$options": "i"}})
    if not sucursal:
        print("ERROR: No se encontró la sucursal Dsitribucion La Paz.")
        return
        
    sucursal_id = str(sucursal['_id'])
    print(f"Sucursal Dsitribucion La Paz ID: {sucursal_id}")
    
    # 2. Buscar si existe Gabriel
    username = "gabriel.peralta.chambi@tabaoda.bo"
    plain_password = "Gabriel.peralta.chambi#2026"
    hashed_pwd = get_password_hash(plain_password)
    
    existing_user = await db.users.find_one({"username": username})
    
    if existing_user:
        print(f"El usuario {username} YA EXISTE. Actualizando contraseña y sucursal...")
        await db.users.update_one(
            {"_id": existing_user["_id"]},
            {"$set": {
                "hashed_password": hashed_pwd,
                "sucursal_id": sucursal_id,
                "role": "SUPERVISOR",
                "is_active": True
            }}
        )
        print("Usuario actualizado correctamente.")
    else:
        print(f"El usuario {username} NO EXISTE. Creándolo...")
        from datetime import datetime
        new_user = {
            "tenant_id": tenant_id,
            "username": username,
            "email": username,
            "hashed_password": hashed_pwd,
            "full_name": "Gabriel Peralta Chambi",
            "role": "SUPERVISOR",
            "is_active": True,
            "is_superuser": False,
            "sucursal_id": sucursal_id,
            "created_at": datetime.now()
        }
        await db.users.insert_one(new_user)
        print("Usuario creado correctamente.")

if __name__ == '__main__':
    asyncio.run(setup_gabriel())
