import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings

async def find_sale():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client.salessystem
    
    # We are looking for a sale whose _id as string ends with 731d52 (case insensitive)
    # But usually the ticket is the last 6 chars of the ObjectID.
    # ObjectID is 24 hex chars. We can use a regex or just fetch recent sales from 08/06/2026.
    
    sales = await db["sales"].find({"created_at": {"$gte": "2026-06-08"}}).to_list(1000)
    for sale in sales:
        sale_id = str(sale["_id"])
        if sale_id.endswith("731d52") or sale_id.endswith("731D52") or "731d52" in sale_id.lower():
            print("Found Sale:", sale_id)
            print("Total:", sale.get("total"))
            print("Pagos:", sale.get("pagos"))
            print("Items:")
            for item in sale.get("items", []):
                print(f"  {item.get('cantidad')}x {item.get('descripcion')} - {item.get('subtotal')}")
            return
            
    # If not found by date string (if created_at is datetime obj)
    sales2 = await db["sales"].find({}).sort("created_at", -1).to_list(1000)
    for sale in sales2:
        sale_id = str(sale["_id"])
        if sale_id.lower().endswith("731d52"):
            print("Found Sale:", sale_id)
            print("Total:", sale.get("total"))
            print("Pagos:", sale.get("pagos"))
            print("Items:")
            for item in sale.get("items", []):
                print(f"  {item.get('cantidad')}x {item.get('descripcion')} - {item.get('subtotal')}")
            return
            
    print("Sale not found.")

if __name__ == "__main__":
    asyncio.run(find_sale())
