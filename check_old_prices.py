import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    sucursal_id = "69cd80098f3f6866d4cfbb64" # Heroinas
    
    ids = ["6aac195b231eec6c5b7bb12e", "6aac19c8231eec6c5b7bb132", "6aac1702231eec6c5b7bb119", "6aac18d8231eec6c5b7bb121", "6aac1918231eec6c5b7bb12c"]
    
    # Try to find recent sales to get the price
    for pid in ids:
        sale_item = await db.sale_items.find_one({
            "producto_id": pid,
            "tenant_id": tenant_id
        }, sort=[("created_at", -1)])
        
        if sale_item:
            print(f"Product {pid} last sold for: {sale_item.get('precio_unitario')} (SaleItem)")
        else:
            print(f"Product {pid} has no sale items")

asyncio.run(get_db_info())
