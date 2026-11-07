import asyncio
from app.infrastructure.db import init_db
from app.domain.models.inventario import InventoryLog

async def main():
    await init_db()
    tenant_id = '69cd7f0a8f3f6866d4cfbb62'
    db = InventoryLog.get_motor_collection().database
    colls = await db.list_collection_names()
    print("Colecciones en BD:", [c for c in colls if "pedido" in c or "traslado" in c or "inventario" in c])
    
    for cname in ["pedidos", "pedidos_internos", "traslados_inventario"]:
        if cname in colls:
            count = await db[cname].count_documents({"tenant_id": tenant_id})
            print(f"Total en {cname}: {count}")

if __name__ == "__main__":
    asyncio.run(main())
