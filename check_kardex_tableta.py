import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    sucursal_id = "69cd80098f3f6866d4cfbb64" # Heroinas
    producto_id = "6aac19c8231eec6c5b7bb132" # TABLETA CHOC
    
    cursor = db.inventory_logs.find({
        "tenant_id": tenant_id,
        "sucursal_id": sucursal_id,
        "producto_id": producto_id
    }).sort("created_at", -1)
    
    items = await cursor.to_list(length=10)
    for i in items:
        print(f"Log: {i.get('created_at')} | {i.get('tipo_movimiento')} | {i.get('cantidad_movida')} | Stock: {i.get('stock_resultante')} | User: {i.get('usuario_nombre')}")

asyncio.run(get_db_info())
