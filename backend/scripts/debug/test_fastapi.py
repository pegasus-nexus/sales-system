import asyncio
import sys
from pathlib import Path

# Setup Path
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.append(str(current_dir))

from app.services.ml_service import predict_demand
from app.services.orchestration_service import get_dashboard_orchestration
from fastapi.encoders import jsonable_encoder

async def test():
    print("Testing ML serialization...")
    res = await predict_demand('69cd7f0a8f3f6866d4cfbb62', predict_days=7)
    try:
        j = jsonable_encoder(res)
        print("ML serialized successfully")
    except Exception as e:
        import traceback
        traceback.print_exc()

    print("\nTesting Orchestration serialization...")
    res2 = await get_dashboard_orchestration('69cd7f0a8f3f6866d4cfbb62', days=30)
    try:
        j2 = jsonable_encoder(res2)
        print("Orchestration serialized successfully")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
