import asyncio
import sys
from pathlib import Path

# Setup Path
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.append(str(current_dir))

from app.services.analytics_service import get_dashboard_metrics
from app.services.bcg_service import calculate_bcg_matrix
from fastapi.encoders import jsonable_encoder
from datetime import datetime, timedelta

async def test():
    tenant='69cd7f0a8f3f6866d4cfbb62'
    start=datetime.utcnow()-timedelta(days=30)
    end=datetime.utcnow()
    
    print("Testing DASHBOARD...")
    try:
        res1 = await get_dashboard_metrics(tenant_id=tenant, start_date=start, end_date=end)
        j1 = jsonable_encoder(res1)
        print("DASHBOARD OK")
    except Exception as e:
        import traceback
        traceback.print_exc()

    print("Testing BCG...")
    try:
        res2 = await calculate_bcg_matrix(tenant_id=tenant, start_date=start, end_date=end)
        j2 = jsonable_encoder(res2)
        print("BCG OK")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
