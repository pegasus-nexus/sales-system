import sys
sys.path.insert(0, '.')
import asyncio
import pandas as pd
from datetime import datetime
from app.services.analytics_service import get_dashboard_metrics, _dashboard_cache
from app.infrastructure.db import init_db

async def main():
    await init_db()
    _dashboard_cache.clear()
    
    tenant_id = '69cd7f0a8f3f6866d4cfbb62'
    now = datetime.utcnow()
    
    res = await get_dashboard_metrics(
        tenant_id=tenant_id,
        start_date=now,
        end_date=now,
        time_range='today'
    )
    
    print("\n--- KPI METRICS FOR TODAY ---")
    print("Ventas Brutas:", res.get("overview", {}).get("ventas_brutas"))
    print("Margen Liquido:", res.get("overview", {}).get("margen_liquido"))
    print("Total Ordenes:", res.get("overview", {}).get("total_orders"))
    print("Sales by Branch:", res.get("sales_by_branch"))

if __name__ == '__main__':
    asyncio.run(main())
