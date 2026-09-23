import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings
from bson import ObjectId

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client["sales_system_prod"]
    
    tenant_id = ObjectId("6a9f09546881511d90fc72e9")
    
    # Remove MULTI_SUCURSAL feature
    await db["tenants"].update_one(
        {"_id": tenant_id},
        {"$pull": {"features": "MULTI_SUCURSAL"}}
    )
    print("Módulo MULTI_SUCURSAL desactivado. El tenant vuelve a ser de Sucursal Única.")
            
asyncio.run(main())
