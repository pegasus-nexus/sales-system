import asyncio
import sys
import os
from datetime import datetime, timezone
import json
import pandas as pd

# Add backend directory to sys.path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.services.analytics_service import get_dashboard_metrics
from app.db import get_raw_db
from app.infrastructure.db import init_db

async def main():
    # Initialize the database!
    await init_db()
    
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    print(f"Using tenant_id: {tenant_id}")
    
    # Test a custom date range 18/07/2026 to 19/07/2026
    start_date = datetime(2026, 7, 18, 0, 0, 0, tzinfo=timezone.utc)
    end_date = datetime(2026, 7, 19, 23, 59, 59, tzinfo=timezone.utc)
    
    print(f"Calling get_dashboard_metrics for {start_date} to {end_date}...")
    res = await get_dashboard_metrics(
        tenant_id=tenant_id,
        start_date=start_date,
        end_date=end_date,
        sucursal_id=None,
        time_range='custom',
        clima_evento=None
    )
    
    print("\nResult overview:")
    print(json.dumps(res.get("overview"), indent=2, default=str))
    
    print(f"\nTotal records in revenue_trend: {len(res.get('revenue_trend', []))}")
    print(f"Branches breakdown: {res.get('sales_by_branch')}")
    print(f"Top categories: {res.get('top_categories')}")

if __name__ == "__main__":
    asyncio.run(main())
