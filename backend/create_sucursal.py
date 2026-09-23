import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from bson import ObjectId
from app.infrastructure.core.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client["sales_system_prod"]
    
    tenant_id = "6a9f09546881511d90fc72e9"
    
    now = datetime.now(timezone.utc)
    
    # 1. Crear Sucursal
    sucursal_id = ObjectId()
    sucursal_doc = {
        "_id": sucursal_id,
        "tenant_id": tenant_id,
        "nombre": "Sucursal Principal (Punto de Venta)",
        "ciudad": "Ciudad Base",
        "direccion": "Dirección Principal",
        "telefono": "",
        "tipo": "FISICA",
        "is_active": True,
        "deleted_at": None,
        "deleted_by": None,
        "created_at": now
    }
    
    await db["sucursales"].insert_one(sucursal_doc)
    print(f"Sucursal creada con ID: {sucursal_id}")
    
    # 2. Crear Almacén asociado (por defecto)
    almacen_id = ObjectId()
    almacen_doc = {
        "_id": almacen_id,
        "tenant_id": tenant_id,
        "sucursal_id": str(sucursal_id),
        "nombre": "Almacén Principal",
        "tipo": "VENTAS",
        "is_default": True,
        "is_active": True,
        "deleted_at": None,
        "deleted_by": None,
        "created_at": now
    }
    
    await db["almacenes"].insert_one(almacen_doc)
    print(f"Almacén creado con ID: {almacen_id}")
    
    # Check
    s = await db["sucursales"].find_one({"_id": sucursal_id})
    a = await db["almacenes"].find_one({"_id": almacen_id})
    print(f"Verificación: Sucursal en BD: {s['nombre']} | Almacén en BD: {a['nombre']}")
    
asyncio.run(main())
