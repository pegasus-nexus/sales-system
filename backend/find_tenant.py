import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client["sales_system_prod"]
    
    # Buscar el tenant por ID parcial o nombre
    tenant = await db["tenants"].find_one({
        "$or": [
            {"_id": {"$regex": "^6a9f0954"}},
            {"nombre": {"$regex": "Colectivo", "$options": "i"}}
        ]
    })
    
    if not tenant:
        print("Tenant no encontrado.")
        return
        
    print(f"Tenant Encontrado: {tenant.get('nombre')} (ID: {tenant.get('_id')})")
    
    # Ver sucursales actuales
    sucursales = await db["sucursales"].find({"tenant_id": str(tenant["_id"])}).to_list(None)
    print(f"\nSucursales actuales: {len(sucursales)}")
    for s in sucursales:
        print(f"  - {s.get('nombre')} (ID: {s.get('_id')})")
        
asyncio.run(main())
