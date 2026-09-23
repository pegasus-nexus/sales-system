import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    # Let's group by sucursal
    cursor = db.inventario.find({
        "tenant_id": tenant_id,
        "producto_id": {"$in": ["69cd81b68f3f6866d4cfbc6f", "6aac19c8231eec6c5b7bb132"]}
    })
    
    sucursales = {}
    items = await cursor.to_list(length=1000)
    for i in items:
        suc = i.get('sucursal_id')
        pid = i.get('producto_id')
        cant = i.get('cantidad', 0)
        
        if suc not in sucursales:
            sucursales[suc] = {'MARACUYA SEMIDULCE': 0, 'TABLETA CHOC...': 0}
            
        if pid == "69cd81b68f3f6866d4cfbc6f":
            sucursales[suc]['MARACUYA SEMIDULCE'] += cant
        else:
            sucursales[suc]['TABLETA CHOC...'] += cant
            
    for suc, data in sucursales.items():
        print(f"Sucursal: {suc} -> MARACUYA: {data['MARACUYA SEMIDULCE']}, TABLETA: {data['TABLETA CHOC...']}")

asyncio.run(get_db_info())
