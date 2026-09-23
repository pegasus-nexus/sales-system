import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    product_id = "6aac19c8231eec6c5b7bb132" # TABLETA CHOC. SABOR A MARACUYÁ - 50 G
    
    cursor = db.inventory_logs.find({
        "tenant_id": tenant_id,
        "producto_id": product_id,
        "sucursal_id": "69dfa560bb46ddb1ff3d5af2" # Supermercados
    }).sort("created_at", -1)
    
    logs = await cursor.to_list(length=10)
    for l in logs:
        print(f"Log: Suc: {l.get('sucursal_id')}, Almacen: {l.get('almacen_id')}, Tipo: {l.get('tipo_movimiento')}, Cantidad: {l.get('cantidad_movida')}, stock: {l.get('stock_resultante')}")

asyncio.run(get_db_info())
