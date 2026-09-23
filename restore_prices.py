import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def restore_prices():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    sucursal_heroinas = "69cd80098f3f6866d4cfbb64"
    sucursal_recoleta = "69cd84c58f3f6866d4cfbc8b" # Used as reference
    
    ids = ["6aac195b231eec6c5b7bb12e", "6aac19c8231eec6c5b7bb132", "6aac1702231eec6c5b7bb119", "6aac18d8231eec6c5b7bb121", "6aac1918231eec6c5b7bb12c"]
    
    for pid in ids:
        # Get price from Recoleta
        ref_inv = await db.inventario.find_one({
            "producto_id": pid,
            "sucursal_id": sucursal_recoleta
        })
        
        if ref_inv and ref_inv.get("precio_sucursal") is not None:
            price = ref_inv.get("precio_sucursal")
            print(f"Restoring {pid} price to {price}")
            
            await db.inventario.update_one(
                {"producto_id": pid, "sucursal_id": sucursal_heroinas},
                {"$set": {"precio_sucursal": price}}
            )
        else:
            print(f"No reference price found for {pid}")

asyncio.run(restore_prices())
