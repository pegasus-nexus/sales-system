import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
from motor.motor_asyncio import AsyncIOMotorClient
from app.auth import get_password_hash

async def reset_heroinas():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    
    users_to_reset = [
        "taboada.heroinas@gmail.com",
        "sucursal.heroinas.taboada@gmail.com"
    ]
    
    new_password = "Heroinas.Taboada#2026"
    hashed_pwd = get_password_hash(new_password)
    
    for username in users_to_reset:
        res = await db.users.update_one(
            {"username": username},
            {"$set": {"hashed_password": hashed_pwd}}
        )
        if res.modified_count > 0:
            print(f"Contraseña actualizada para {username}")
        else:
            print(f"No se modificó {username} (Quizá ya tenía esa contraseña o no se encontró)")
            
if __name__ == '__main__':
    asyncio.run(reset_heroinas())
