import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def search_missing_sales():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    print("--- Searching for the 7 missing sales ---")
    
    # We will fetch all sales inserted recently (by Object ID generation time)
    # The generation time is embedded in the _id.
    from bson.objectid import ObjectId
    from datetime import datetime, timedelta
    
    # ObjectIDs generated in the last 24 hours
    yesterday = datetime.utcnow() - timedelta(days=2)
    dummy_id = ObjectId.from_datetime(yesterday)
    
    cursor = db.sales.find({"_id": {"": dummy_id}})
    
    supermercado_sales = []
    async for sale in cursor:
        supermercado_sales.append(sale)
        
    print(f"Total sales created in the DB in the last 2 days: {len(supermercado_sales)}")
    
    # Sort them by total to see if there is one large sale, or sum them up
    
    # Let's filter those where created_at is NOT in August 29-30-31
    anomalous = []
    for s in supermercado_sales:
        ca = s.get('created_at')
        if ca and (ca.month != 8 or ca.year != 2026):
            anomalous.append(s)
            
    print(f"Sales with anomalous dates: {len(anomalous)}")
    for a in anomalous:
         print(f"ID: {a.get('_id')}, Date: {a.get('created_at')}, Total: {a.get('total')}")

if __name__ == '__main__':
    asyncio.run(search_missing_sales())
