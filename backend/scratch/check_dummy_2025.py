import asyncio
import os
import sys
from datetime import date, datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db
from app.utils.date_utils import get_day_range_bolivia

async def check_sales_2025_dummy():
    await init_db()
    db = await get_raw_db()

    start_dt, end_dt = get_day_range_bolivia("2025-08-21")

    # Check dummy in db.sales
    docs_sales = await db.sales.find({
        "tenant_id": "69cd7f0a8f3f6866d4cfbb62",
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }).to_list(100)

    total_sales = sum(float(str(d.get("total", 0))) for d in docs_sales)
    print(f"Total en db.sales para 21/08/2025: {len(docs_sales)} docs | Total: Bs. {total_sales}")

    # Check real in db.ventas_historicas_crudas
    start_hist = datetime(2025, 8, 21, 0, 0, 0)
    end_hist = datetime(2025, 8, 21, 23, 59, 59)
    docs_hist = await db.ventas_historicas_crudas.find({
        "fecha_transaccion": {"$gte": start_hist, "$lte": end_hist}
    }).to_list(1000)

    import math
    total_hist = sum(float(d.get("monto_total_bs", 0)) for d in docs_hist if d.get("monto_total_bs") is not None and not (isinstance(d.get("monto_total_bs"), float) and math.isnan(d.get("monto_total_bs"))))
    print(f"Total en db.ventas_historicas_crudas para 21/08/2025: {len(docs_hist)} docs | Total: Bs. {total_hist:.2f}")

asyncio.run(check_sales_2025_dummy())
