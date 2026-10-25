import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings
from bson import ObjectId

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client["sales_system_prod"]
    
    tenant_id = ObjectId("6a9f09546881511d90fc72e9")
    tenant = await db["tenants"].find_one({"_id": tenant_id})
    if tenant:
        print("Tenant features:", tenant.get("features", []))
        
        # Add MULTI_SUCURSAL feature if missing
        if "MULTI_SUCURSAL" not in tenant.get("features", []):
            await db["tenants"].update_one(
                {"_id": tenant_id},
                {"$addToSet": {"features": "MULTI_SUCURSAL"}}
            )
            print("Agregado MULTI_SUCURSAL a los features del tenant.")
        else:
            print("El tenant ya tiene MULTI_SUCURSAL.")
    else:
        print("Tenant not found!")
            
asyncio.run(main())
