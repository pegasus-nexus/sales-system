import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client["sales_system_prod"]

    # Search via regex (works without text index)
    cursor = db["products"].find(
        {"descripcion": {"$regex": "choco|cacao|granel|leche|azucar|azucar", "$options": "i"}},
        {"descripcion": 1, "codigo_corto": 1, "costo_producto": 1, "precio_venta": 1,
         "is_active": 1, "deleted_at": 1, "categoria_id": 1, "tipo_item": 1}
    )
    products = await cursor.to_list(length=200)

    print(f"Productos relacionados encontrados: {len(products)}")
    print("=" * 70)
    for p in products:
        deleted = p.get("deleted_at")
        active  = p.get("is_active", True)
        if deleted:
            estado = "SOFT-DELETED"
        elif not active:
            estado = "INACTIVO"
        else:
            estado = "ACTIVO"
        print(f"  [{estado}] {p.get('descripcion','?')[:60]:<60} | {p.get('codigo_corto','')}")

    print("\n--- Totales generales de productos ---")
    total    = await db["products"].count_documents({})
    activos  = await db["products"].count_documents({"is_active": True, "deleted_at": None})
    inactivos= await db["products"].count_documents({"is_active": False, "deleted_at": None})
    deleted_  = await db["products"].count_documents({"deleted_at": {"$ne": None}})
    print(f"  Total: {total} | Activos: {activos} | Inactivos: {inactivos} | Soft-deleted: {deleted_}")

asyncio.run(main())
