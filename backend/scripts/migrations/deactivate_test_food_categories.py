"""
Inactiva categorías de prueba/ejemplo (Planes, Proteínas, Carbohidratos, Bowls, Tamaño)
asociadas erróneamente al tenant de Chocolates Taboada.
Sigue estrictamente la Regla de Oro: NO borrar, solo soft-delete (is_active = False).
"""
import asyncio

from bson import ObjectId

from app.domain.models.category import Category
from app.infrastructure.db import init_db

TARGET_CATEGORY_IDS = [
    "6a2ae4936fbc67ad3af13556",  # Bowls
    "6a2ae4936fbc67ad3af13555",  # Planes
    "6a2ae4936fbc67ad3af13559",  # Proteinas
    "6a2ae4936fbc67ad3af13558",  # Carbohidratos
    "6a2ae4936fbc67ad3af13557",  # Tamaño
]

async def main():
    await init_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    print(f"Buscando categorías de prueba en tenant {tenant_id}...")
    deactivated = 0
    for cat_id in TARGET_CATEGORY_IDS:
        try:
            obj_id = ObjectId(cat_id)
            cat = await Category.find_one({"_id": obj_id, "tenant_id": tenant_id})
            if cat:
                if cat.is_active:
                    cat.is_active = False
                    await cat.save()
                    print(f"  [OK] Desactivada categoría: {cat.name} ({cat.id})")
                    deactivated += 1
                else:
                    print(f"  [INFO] Categoría ya estaba inactiva: {cat.name} ({cat.id})")
            else:
                print(f"  [SKIP] Categoría no encontrada: {cat_id}")
        except Exception as e:
            print(f"  [ERROR] Error procesando categoría {cat_id}: {e}")

    print(f"Proceso finalizado. Total desactivadas: {deactivated}")

if __name__ == "__main__":
    asyncio.run(main())
