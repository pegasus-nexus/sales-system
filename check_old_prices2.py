import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_db_info():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    
    ids = ["6aac195b231eec6c5b7bb12e", "6aac19c8231eec6c5b7bb132", "6aac1702231eec6c5b7bb119", "6aac18d8231eec6c5b7bb121", "6aac1918231eec6c5b7bb12c"]
    
    for pid in ids:
        sale = await db.sales.find_one({
            "tenant_id": tenant_id,
            "detalles.producto_id": pid
        }, sort=[("created_at", -1)])
        
        if sale:
            for item in sale.get("detalles", []):
                if item.get("producto_id") == pid:
                    print(f"Product {pid} last sold for: {item.get('precio_unitario')} (Sale)")
                    break
        else:
            print(f"Product {pid} has no sales")

asyncio.run(get_db_info())
