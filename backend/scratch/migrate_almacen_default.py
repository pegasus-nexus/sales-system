import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings

async def run_migration():
    print("Connecting to DB:", settings.MONGODB_URL)
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    # 1. Update Inventario
    inv_result = await db["inventarios"].update_many(
        {"almacen_id": {"$exists": False}},
        {"$set": {"almacen_id": "default"}}
    )
    print(f"Updated {inv_result.modified_count} Inventario documents.")
    
    # 2. Update InventoryLogs
    log_result = await db["inventory_logs"].update_many(
        {"almacen_id": {"$exists": False}},
        {"$set": {"almacen_id": "default"}}
    )
    print(f"Updated {log_result.modified_count} InventoryLog documents.")
    
    # 3. Update Sales (items might not have it, but sales doesn't store almacen_id inside items usually, but at root maybe? In SalesSystem we pass almacen_id from POS, but historical sales just have sucursal_id. The POS now sends almacen_id in the create sale payload)
    
    print("Migration finished.")

if __name__ == "__main__":
    asyncio.run(run_migration())
