import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
from app.auth import get_password_hash

async def manage_jhesica():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    sucursal_id = "69cd80098f3f6866d4cfbb64"
    username = "jhesica.bohorquez.peredo"
    fullname = "Jhesica Selena Bohorquez Peredo"
    plain_password = "Jhes12boh90per%6213"
    
    hashed_pwd = get_password_hash(plain_password)
    
    user = await db.users.find_one({"username": username})
    
    if user:
        print(f"El usuario {username} YA EXISTE.")
        # Update tenant and sucursal just in case
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "tenant_id": tenant_id,
                "sucursal_id": sucursal_id,
                "hashed_password": hashed_pwd,
                "full_name": fullname,
                "role": "CAJERO"
            }}
        )
        print("Datos, contraseña y sucursal actualizados al tenant Chocolates Taboada.")
    else:
        print(f"El usuario {username} NO EXISTE. Creándolo...")
        from datetime import datetime
        new_user = {
            "tenant_id": tenant_id,
            "username": username,
            "email": username,
            "hashed_password": hashed_pwd,
            "full_name": fullname,
            "role": "CAJERO",
            "is_active": True,
            "is_superuser": False,
            "sucursal_id": sucursal_id,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(new_user)
        print("Usuario creado correctamente en el tenant Chocolates Taboada.")

if __name__ == '__main__':
    asyncio.run(manage_jhesica())
