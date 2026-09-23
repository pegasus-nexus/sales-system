import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client["sales_system_prod"]
    
    # Obtener todos los tenants
    tenants = await db["tenants"].find({}).to_list(None)
    for t in tenants:
        t_id = str(t["_id"])
        if t_id.startswith("6a9f0954") or "colectivo" in t.get("nombre", "").lower():
            print(f"Tenant Encontrado: {t.get('nombre')} (ID: {t_id})")
            sucursales = await db["sucursales"].find({"tenant_id": t_id}).to_list(None)
            print(f"  Sucursales actuales: {len(sucursales)}")
            for s in sucursales:
                print(f"    - {s.get('nombre')} (ID: {s.get('_id')})")
            return
            
    print("Definitivamente no se encontró el tenant.")
        
asyncio.run(main())
