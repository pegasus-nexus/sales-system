import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime

async def check_tenants_date():
    await init_db()
    db = await get_raw_db()

    start_date = datetime(2026, 4, 1)
    
    # 1. Chequear tenant_ids en 'sales' en 2026-04-03
    sales_tenants = await db.sales.distinct("tenant_id", {"created_at": {"$gte": start_date}})
    print("Distinct tenant_id en sales (Abril 2026):", sales_tenants)

    # 2. Chequear un documento de venta de 2026-04-03
    sample_sale = await db.sales.find_one({"created_at": {"$gte": datetime(2026, 4, 3), "$lte": datetime(2026, 4, 4)}})
    print("\nDocumento de ejemplo en sales (03/04/2026):")
    print(sample_sale)

if __name__ == '__main__':
    asyncio.run(check_tenants_date())
