import asyncio
from datetime import datetime, timezone
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db import init_db
from app.services.analytics_service import get_dashboard_metrics
from app.services.bcg_service import calculate_bcg_matrix

async def main():
    await init_db()
    
    tenant_id = "default"
    end_date = datetime.now(timezone.utc)
    from datetime import timedelta
    start_date = end_date - timedelta(days=90)  # Similar a AnaliticaAvanzada.tsx: 90 days

    print("=================== PERFILANDO DASHBOARD METRICS ===================")
    import time
    t0 = time.time()
    res = await get_dashboard_metrics(
        tenant_id=tenant_id,
        start_date=start_date,
        end_date=end_date,
        sucursal_id='all',
        time_range='90days'
    )
    t1 = time.time()
    print(f"Total Dashboard Metrics Time: {(t1-t0)*1000:.2f}ms")

    print("\n=================== PERFILANDO BCG MATRIX ===================")
    t2 = time.time()
    res2 = await calculate_bcg_matrix(
        tenant_id=tenant_id,
        start_date=start_date,
        end_date=end_date,
        sucursal_id=None
    )
    t3 = time.time()
    print(f"Total BCG Matrix Time: {(t3-t2)*1000:.2f}ms")

if __name__ == "__main__":
    asyncio.run(main())
