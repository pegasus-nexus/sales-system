import asyncio
import sys
from pathlib import Path

# Setup Path
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.append(str(current_dir))

from app.services.orchestration_service import get_dashboard_orchestration
from app.services.ml_service import predict_demand
from app.services.bcg_service import calculate_bcg_matrix
from app.services.analytics_service import get_dashboard_metrics
from datetime import datetime

async def test_all():
    tenant_id = "test-taboada"
    
    print("Testing ML Service...")
    try:
        res = await predict_demand(tenant_id=tenant_id, predict_days=7)
        print("ML Service OK")
    except Exception as e:
        import traceback
        traceback.print_exc()

    print("\nTesting Orchestration Service...")
    try:
        res2 = await get_dashboard_orchestration(tenant_id=tenant_id, days=30)
        print("Orchestration Service OK")
    except Exception as e:
        import traceback
        traceback.print_exc()

    print("\nTesting BCG Service...")
    try:
        res3 = await calculate_bcg_matrix(tenant_id=tenant_id, start_date=datetime(2023,1,1), end_date=datetime(2026,1,1))
        print("BCG Service OK")
    except Exception as e:
        import traceback
        traceback.print_exc()

    print("\nTesting Dashboard Metrics Service...")
    try:
        res4 = await get_dashboard_metrics(tenant_id=tenant_id, start_date=datetime(2023,1,1), end_date=datetime(2026,1,1))
        print("Dashboard Metrics Service OK")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_all())
