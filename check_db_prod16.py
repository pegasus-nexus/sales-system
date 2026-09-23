import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    cursor = db.traslados_inventario.find({
        "tenant_id": tenant_id
    }).sort("created_at", -1)
    
    traslados = await cursor.to_list(length=10)
    for t in traslados:
        print(f"Traslado: Origen {t.get('sucursal_origen_id')} -> Destino {t.get('sucursal_destino_id')}, Estado: {t.get('estado')}")
        for item in t.get('items', []):
            print(f"  Item: {item.get('producto_id')} - Desc: {item.get('producto_nombre')} - Cant: {item.get('cantidad_enviada')}")

asyncio.run(get_db_info())
