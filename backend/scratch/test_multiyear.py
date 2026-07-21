import asyncio
from datetime import datetime, timezone, date
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db import init_db
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def main():
    await init_db()
    
    tenant_id = "default"
    # Test with today
    hoy = datetime.now(timezone.utc).date()
    
    import time
    t0 = time.time()
    print("=================== PERFILANDO HOURLY MULTIYEAR ===================")
    res = await get_hourly_multiyear(
        tenant_id=tenant_id,
        fecha_referencia=hoy,
        sucursal='all'
    )
    t1 = time.time()
    print(f"Total Hourly Multi-Year Time: {(t1-t0)*1000:.2f}ms")

if __name__ == "__main__":
    asyncio.run(main())
