import asyncio
from datetime import datetime, timezone
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "app"))

from services.portfolio_service import get_portfolio_data

async def run_test():
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    start = datetime(2026, 6, 1, tzinfo=timezone.utc)
    end = datetime(2026, 6, 30, 23, 59, 59, tzinfo=timezone.utc)
    
    # Mock get_raw_db
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    import app.services.portfolio_service as ps
    # Patch get_raw_db in the module
    async def mock_get_raw_db(): return db
    ps.get_raw_db = mock_get_raw_db
    # Also patch it inside the function just in case
    
    import unittest.mock
    with unittest.mock.patch('app.db.get_raw_db', new=mock_get_raw_db):
        print("Fetching portfolio data...")
        res = await get_portfolio_data(tenant_id, start, end)

    
    print(f"Period: {res.period}")
    print(f"Products returned: {len(res.products)}")
    
    if res.products:
        print("Top 3 products:")
        for p in res.products[:3]:
            print(f"  {p.nombre}: Ventas {p.ventas:.2f}, Cantidad {p.cantidad:.2f}, Margen {p.margen:.2f}")

if __name__ == "__main__":
    asyncio.run(run_test())
