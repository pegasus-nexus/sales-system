import asyncio
import os
import sys
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Make sure we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.core.config import settings

async def analyze_dates():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    collections_to_check = ['sales', 'movimientos_caja', 'compras', 'inventory_logs', 'traslados']
    
    print("=== DATABASE DATE ANALYSIS ===")
    
    for coll_name in collections_to_check:
        print(f"\n--- Collection: {coll_name} ---")
        coll = db[coll_name]
        
        count = await coll.count_documents({})
        if count == 0:
            print("  No documents found.")
            continue
            
        print(f"  Total documents: {count}")
        
        # We need to find the earliest and latest dates, and count by year/month
        pipeline = [
            {
                "$project": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"},
                    "date": "$created_at"
                }
            },
            {
                "$group": {
                    "_id": {"year": "$year", "month": "$month"},
                    "count": {"$sum": 1},
                    "min_date": {"$min": "$date"},
                    "max_date": {"$max": "$date"}
                }
            },
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        
        results = await coll.aggregate(pipeline).to_list(length=None)
        
        for r in results:
            year = r["_id"].get("year")
            month = r["_id"].get("month")
            print(f"  {year}-{month:02d} : {r['count']} records (from {r.get('min_date')} to {r.get('max_date')})")
            
        # Also check if any documents have an ObjectID that implies July 2026 but created_at is earlier
        # ObjectID timestamp is the first 4 bytes of the ObjectId
        
        # Let's get a few examples from May or April 2026 to see if created_at matches ObjectId time
        # Or if the user explicitely provided `created_at` in the migration script, `created_at` will be correct 
        # but ObjectId might be from July. The application usually sorts by `created_at` not `_id`.
        
if __name__ == "__main__":
    asyncio.run(analyze_dates())
