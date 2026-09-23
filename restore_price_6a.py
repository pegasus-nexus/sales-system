import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def restore_prices():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:nuevaContrapra2026porcuet10nesdes3GUR1D4D@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    sucursal_id = "69ce6b7e8a00124dac6ecc99"
    pid = "6a594743eff23444b2715381"
    
    # Try to find a reference price in another branch
    ref_inv = await db.inventario.find_one({
        "producto_id": pid,
        "precio_sucursal": {"$exists": True, "$ne": None}
    })
    
    if ref_inv:
        price = ref_inv.get("precio_sucursal")
        print(f"Restoring {pid} price to {price}")
        
        await db.inventario.update_one(
            {"producto_id": pid, "sucursal_id": sucursal_id},
            {"$set": {"precio_sucursal": price}}
        )
    else:
        print(f"No reference price found for {pid}")

asyncio.run(restore_prices())
