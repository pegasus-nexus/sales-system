import asyncio
import os
import sys
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath('backend'))
from app.db import get_raw_db

async def main():
    from app.infrastructure.db import init_db
    import os
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.abspath('backend'), '.env'))
    await init_db()
    db = await get_raw_db()
    
    # Check 2026
    start_26 = datetime(2026, 1, 1)
    end_26 = datetime(2026, 12, 31, 23, 59, 59)
    cnt_26 = await db.ventas_historicas_crudas.count_documents({"fecha_transaccion": {"$gte": start_26, "$lte": end_26}})
    print(f"2026 count: {cnt_26}")

    # Check 2025
    start_25 = datetime(2025, 1, 1)
    end_25 = datetime(2025, 12, 31, 23, 59, 59)
    cnt_25 = await db.ventas_historicas_crudas.count_documents({"fecha_transaccion": {"$gte": start_25, "$lte": end_25}})
    print(f"2025 count: {cnt_25}")

    # Check 2024
    start_24 = datetime(2024, 1, 1)
    end_24 = datetime(2024, 12, 31, 23, 59, 59)
    cnt_24 = await db.ventas_historicas_crudas.count_documents({"fecha_transaccion": {"$gte": start_24, "$lte": end_24}})
    print(f"2024 count: {cnt_24}")

if __name__ == "__main__":
    asyncio.run(main())
