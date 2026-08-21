import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def check_hist_dates():
    await init_db()
    db = await get_raw_db()
    
    # Check sales in ventas_historicas_crudas for 22/08/2025 and 23/08/2024 for Heroinas
    start_2025 = datetime(2025, 8, 22, 0, 0, 0)
    end_2025 = datetime(2025, 8, 22, 23, 59, 59)
    
    start_2024 = datetime(2024, 8, 23, 0, 0, 0)
    end_2024 = datetime(2024, 8, 23, 23, 59, 59)

    count_2025 = await db.ventas_historicas_crudas.count_documents({
        "fecha_transaccion": {"$gte": start_2025, "$lte": end_2025},
        "sucursal": {"$regex": "Hero", "$options": "i"}
    })

    count_2024 = await db.ventas_historicas_crudas.count_documents({
        "fecha_transaccion": {"$gte": start_2024, "$lte": end_2024},
        "sucursal": {"$regex": "Hero", "$options": "i"}
    })

    print(f"Ventas históricas crudas para Heroínas 22/08/2025: {count_2025} registros")
    print(f"Ventas históricas crudas para Heroínas 23/08/2024: {count_2024} registros")

    # Let's sum totals if any
    pipeline_2025 = [
        {"$match": {"fecha_transaccion": {"$gte": start_2025, "$lte": end_2025}, "sucursal": {"$regex": "Hero", "$options": "i"}}},
        {"$group": {"_id": None, "total": {"$sum": {"$toDouble": "$monto_total_bs"}}}}
    ]
    res_2025 = await db.ventas_historicas_crudas.aggregate(pipeline_2025).to_list(1)
    print(f"Total monto 22/08/2025: {res_2025}")

    pipeline_2024 = [
        {"$match": {"fecha_transaccion": {"$gte": start_2024, "$lte": end_2024}, "sucursal": {"$regex": "Hero", "$options": "i"}}},
        {"$group": {"_id": None, "total": {"$sum": {"$toDouble": "$monto_total_bs"}}}}
    ]
    res_2024 = await db.ventas_historicas_crudas.aggregate(pipeline_2024).to_list(1)
    print(f"Total monto 23/08/2024: {res_2024}")

asyncio.run(check_hist_dates())
