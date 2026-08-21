import asyncio
import os
import sys
import math
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def test_sum_service():
    await init_db()
    db = await get_raw_db()
    
    start_2025 = datetime(2025, 8, 22, 0, 0, 0)
    end_2025 = datetime(2025, 8, 22, 23, 59, 59)
    
    start_2024 = datetime(2024, 8, 23, 0, 0, 0)
    end_2024 = datetime(2024, 8, 23, 23, 59, 59)

    docs_2025 = await db.ventas_historicas_crudas.find({
        "fecha_transaccion": {"$gte": start_2025, "$lte": end_2025},
        "sucursal": {"$regex": "Hero", "$options": "i"}
    }).to_list(1000)

    docs_2024 = await db.ventas_historicas_crudas.find({
        "fecha_transaccion": {"$gte": start_2024, "$lte": end_2024},
        "sucursal": {"$regex": "Hero", "$options": "i"}
    }).to_list(1000)

    sum_2025 = 0.0
    cnt_2025 = 0
    for d in docs_2025:
        m = d.get("monto_total_bs")
        if m is not None and not (isinstance(m, float) and math.isnan(m)):
            sum_2025 += float(m)
            cnt_2025 += 1

    sum_2024 = 0.0
    cnt_2024 = 0
    for d in docs_2024:
        m = d.get("monto_total_bs")
        if m is not None and not (isinstance(m, float) and math.isnan(m)):
            sum_2024 += float(m)
            cnt_2024 += 1

    print(f"22/08/2025 Heroínas: {cnt_2025} ítems válidos | Total Bs. {sum_2025:.2f}")
    print(f"23/08/2024 Heroínas: {cnt_2024} ítems válidos | Total Bs. {sum_2024:.2f}")

asyncio.run(test_sum_service())
