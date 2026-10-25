import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings
from bson import ObjectId

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client["sales_system_prod"]
    
    tenant_id = "6a9f09546881511d90fc72e9"
    sucursal_id = "6aa329c28a8a411742c05195"  # ID de la sucursal recién creada
    
    # Buscar usuarios de este tenant
    users = await db["users"].find({"tenant_id": tenant_id}).to_list(None)
    
    print(f"Encontrados {len(users)} usuarios para el tenant Colectivo SAS.")
    
    # Asignarles la sucursal
    for u in users:
        await db["users"].update_one(
            {"_id": u["_id"]},
            {"$set": {"sucursal_id": sucursal_id}}
        )
        print(f"Asignada sucursal al usuario: {u.get('email')} (Rol: {u.get('role')})")
        
asyncio.run(main())
