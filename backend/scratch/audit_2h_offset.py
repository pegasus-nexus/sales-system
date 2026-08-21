import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def main():
    await init_db()
    db = await get_raw_db()
    
    # Check sample sales in sales collection: created_at vs any local date field if present
    sample = await db.sales.find_one({"tenant_id": "69cd7f0a8f3f6866d4cfbb62"})
    print("Sample sale fields in DB:")
    for k, v in sample.items():
        print(f"  {k}: {v}")

asyncio.run(main())
