import asyncio
import os
import sys

# Agregar ruta base
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.infrastructure.db import init_db
from app.domain.models.product import Product
from app.domain.models.proveedor import Proveedor
from app.domain.models.tenant import Tenant

async def migrate_proveedores():
    print("Conectando a BD...")
    await init_db()
    
    tenants = await Tenant.find_all().to_list()
    total_creados = 0
    
    for t in tenants:
        print(f"Procesando tenant: {t.name} ({t.id})")
        # Obtener todos los nombres únicos de proveedores de los productos de este tenant
        pipeline = [
            {"$match": {"tenant_id": str(t.id), "proveedor": {"$ne": None, "$ne": ""}}},
            {"$group": {"_id": "$proveedor"}}
        ]
        
        nombres_proveedores = [doc["_id"] for doc in await Product.aggregate(pipeline).to_list()]
        
        for nombre in nombres_proveedores:
            # Buscar si ya existe
            existe = await Proveedor.find_one(Proveedor.tenant_id == str(t.id), Proveedor.nombre == nombre)
            if not existe:
                nuevo = Proveedor(
                    tenant_id=str(t.id),
                    nombre=nombre,
                    notas="Migrado automáticamente desde productos"
                )
                await nuevo.insert()
                total_creados += 1
                print(f"  + Creado proveedor: {nombre}")
    
    print(f"Migracion completada. Total de proveedores creados: {total_creados}")

if __name__ == "__main__":
    asyncio.run(migrate_proveedores())
