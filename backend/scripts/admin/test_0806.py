import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import date
from app.services.hourly_multiyear_service import _build_sucursal_filter, _fetch_day_hourly_historico

async def test_0806():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    suc_filters = await _build_sucursal_filter(db, tenant_id, None)
    print("suc_filters para sucursal=None:", suc_filters)

    h_dict, cnt = await _fetch_day_hourly_historico(db, tenant_id, date(2025, 8, 6), suc_filters)
    print("Resultado _fetch_day_hourly_historico (2025-08-06):", h_dict)
    print("Suma total:", sum(h_dict.values()), "Docs:", cnt)

if __name__ == '__main__':
    asyncio.run(test_0806())
