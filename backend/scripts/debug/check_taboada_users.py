import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings
from app.infrastructure.auth import verify_password, get_password_hash

async def check_users():
    print(f"Conectando a MongoDB: {settings.MONGODB_URL}")
    print(f"Base de Datos: {settings.MONGODB_DB_NAME}")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    users_coll = db["users"]

    # 1. Buscar todos los usuarios que tengan 'taboada' en username, email o nombre
    cursor = users_coll.find({
        "$or": [
            {"username": {"$regex": "taboada", "$options": "i"}},
            {"email": {"$regex": "taboada", "$options": "i"}},
            {"nombre": {"$regex": "taboada", "$options": "i"}},
            {"role": {"$regex": "taboada", "$options": "i"}}
        ]
    })

    users = await cursor.to_list(length=100)
    print(f"\n--- USUARIOS ENCONTRADOS QUE COINCIDEN CON 'taboada' ({len(users)}) ---")
    
    for u in users:
        print("\n----------------------------------------")
        print(f"ID: {u.get('_id')}")
        print(f"Username: {u.get('username')}")
        print(f"Email: {u.get('email')}")
        print(f"Nombre: {u.get('nombre')}")
        print(f"Rol: {u.get('role')}")
        print(f"Tenant ID: {u.get('tenant_id')}")
        print(f"Sucursal ID: {u.get('sucursal_id')}")
        print(f"Is Active: {u.get('is_active')}")
        print(f"Hashed Password: {u.get('hashed_password')[:20]}...")

        # Probar contraseñas recibidas
        passwords_to_test = [
            "darvuh-Synja8-kozpad%$",
            "facturadorCocha001@",
            "taboada123",
            "admin123"
        ]
        
        hashed = u.get("hashed_password")
        if hashed:
            for pwd in passwords_to_test:
                is_valid = verify_password(pwd, hashed)
                if is_valid:
                    print(f"  [EXITO] La contraseña '{pwd}' ES VALIDA para username '{u.get('username')}'!")
                else:
                    print(f"  [X] La contraseña '{pwd}' NO coincide.")

    # 2. Listar también todos los usuarios en general si no se encontró nada especifico
    if not users:
        print("\nBuscando todos los usuarios registrados...")
        all_users = await users_coll.find({}).to_list(length=50)
        print(f"Total usuarios en DB: {len(all_users)}")
        for u in all_users:
            print(f"- Username: {u.get('username')} | Email: {u.get('email')} | Rol: {u.get('role')}")

if __name__ == "__main__":
    asyncio.run(check_users())
