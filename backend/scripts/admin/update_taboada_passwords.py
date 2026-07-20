import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings
from app.infrastructure.auth import get_password_hash, verify_password

async def update_credentials():
    print(f"Conectando a MongoDB: {settings.MONGODB_URL}")
    print(f"Base de Datos: {settings.MONGODB_DB_NAME}")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    users_coll = db["users"]

    # 1. Supermercados Taboada
    # Credenciales deseadas: supermercados.taboada (o supermercados.taboada@taboada.bo) / darvuh-Synja8-kozpad%$
    target_pwd_super = "darvuh-Synja8-kozpad%$"
    hashed_super = get_password_hash(target_pwd_super)
    
    res_super = await users_coll.update_one(
        {"username": "supermercados.taboada"},
        {"$set": {
            "hashed_password": hashed_super,
            "is_active": True
        }}
    )
    print(f"\n[Supermercados Taboada] Usuarios actualizados: {res_super.modified_count}")

    # 2. Facturador Taboada
    # Credenciales deseadas: facturador.taboada / facturadorCocha001@
    target_pwd_fact = "facturadorCocha001@"
    hashed_fact = get_password_hash(target_pwd_fact)

    res_fact = await users_coll.update_one(
        {"username": "facturador.taboada"},
        {"$set": {
            "hashed_password": hashed_fact,
            "is_active": True
        }}
    )
    print(f"[Facturador Taboada] Usuarios actualizados: {res_fact.modified_count}")

    # 3. Verificación de ambas cuentas
    user_super = await users_coll.find_one({"username": "supermercados.taboada"})
    user_fact = await users_coll.find_one({"username": "facturador.taboada"})

    print("\n--- VERIFICACION DE CREDENCIALES FINAL ---")
    if user_super:
        valid_super = verify_password(target_pwd_super, user_super["hashed_password"])
        print(f"User: supermercados.taboada | Email: {user_super.get('email')} | Password Ok?: {valid_super}")
    else:
        print("ERROR: supermercados.taboada no existe!")

    if user_fact:
        valid_fact = verify_password(target_pwd_fact, user_fact["hashed_password"])
        print(f"User: facturador.taboada | Email: {user_fact.get('email')} | Password Ok?: {valid_fact}")
    else:
        print("ERROR: facturador.taboada no existe!")

if __name__ == "__main__":
    asyncio.run(update_credentials())
