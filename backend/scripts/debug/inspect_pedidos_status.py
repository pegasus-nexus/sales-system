import asyncio
from app.infrastructure.db import init_db
from app.domain.models.inventario import InventoryLog

async def main():
    await init_db()
    tenant_id = '69cd7f0a8f3f6866d4cfbb62'
    db = InventoryLog.get_motor_collection().database
    pedidos = await db["pedidos_internos"].find({"tenant_id": tenant_id}).to_list(length=100)
    print(f"Pedidos internos en tenant: {len(pedidos)}")
    for p in pedidos:
        print(f"  ID: {p['_id']} | Estado: {p.get('estado')} | Origen: {p.get('sucursal_origen_id')} | Destino: {p.get('sucursal_id')} | Items: {len(p.get('items', []))}")

if __name__ == "__main__":
    asyncio.run(main())
