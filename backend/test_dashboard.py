import asyncio
import os
import sys

from app.infrastructure.core.config import settings
from app.infrastructure.db import init_db
from app.services.analytics_v2_service import get_dashboard_metrics_v2
from datetime import datetime, timezone

async def main():
    await init_db()
    end_date = datetime.now(timezone.utc)
    start_date = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    res = await get_dashboard_metrics_v2(
        tenant_id="69cd7f0a8f3f6866d4cfbb62",
        start_date=start_date,
        end_date=end_date,
        time_range="30days"
    )
    
    bcg = res.get("bcg_data", {})
    if not bcg:
        print("NO BCG DATA RETURNED")
    else:
        print(f"Estrellas: {len(bcg.get('estrellas', []))}")
        print(f"Vacas: {len(bcg.get('vacas', []))}")
        print(f"Interrogantes: {len(bcg.get('interrogantes', []))}")
        print(f"Perros: {len(bcg.get('perros', []))}")

if __name__ == "__main__":
    asyncio.run(main())
