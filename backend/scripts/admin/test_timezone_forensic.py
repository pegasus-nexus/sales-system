import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime, date
import pandas as pd

async def forensic_timezone_test():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    target_date = date(2026, 8, 5)

    start_local = pd.Timestamp(target_date, tz="America/La_Paz")
    end_local = start_local + pd.Timedelta(days=1)
    start_utc = start_local.tz_convert("UTC").to_pydatetime()
    end_utc = end_local.tz_convert("UTC").to_pydatetime()

    print("==========================================================================")
    print("ANÁLISIS DE MARCAS DE TIEMPO (CREATED_AT) DE LAS VENTAS DE HOY (05/08/2026)")
    print("==========================================================================")
    print(f"Rango local Bolivia: 2026-08-05 00:00:00 (-04:00) a 2026-08-06 00:00:00 (-04:00)")
    print(f"Rango UTC en MongoDB: {start_utc} UTC a {end_utc} UTC\n")

    sales = await db.sales.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc, "$lt": end_utc},
        "anulada": {"$ne": True}
    }).sort("created_at", 1).to_list(100)

    print(f"Total ventas registradas hoy: {len(sales)}\n")
    print(f"{'Sale ID':<26} | {'created_at (UTC en BD)':<25} | {'Hora UTC':<8} | {'Hora Local Bolivia (UTC-4)':<26} | {'Total Bs.':<10}")
    print("-" * 105)

    for s in sales:
        ca = s.get("created_at")
        utc_hour = ca.hour
        # Convertir a hora de Bolivia (UTC-4)
        local_ts = pd.Timestamp(ca).tz_localize("UTC").tz_convert("America/La_Paz")
        local_hour = local_ts.hour
        total = float(str(s.get("total", 0)))
        print(f"{str(s['_id']):<26} | {str(ca):<25} | {utc_hour:02d}:00    | {local_ts.strftime('%H:%M:%S (%d/%m)')} (Hora {local_hour:02d}:00) | Bs. {total:>7,.2f}")

    # Probar como agrupa el pipeline actual con offset -4 horas
    tz_offset_ms = -4 * 3600 * 1000
    pipeline = [
        {"$match": {
            "tenant_id": tenant_id,
            "created_at": {"$gte": start_utc, "$lt": end_utc},
            "anulada": {"$ne": True}
        }},
        {"$group": {
            "_id": {
                "$hour": {
                    "$dateAdd": {
                        "startDate": "$created_at",
                        "unit": "millisecond",
                        "amount": tz_offset_ms
                    }
                }
            },
            "total": {"$sum": "$total"}
        }},
        {"$sort": {"_id": 1}}
    ]

    res = await db.sales.aggregate(pipeline).to_list(100)
    print("\n==========================================================================")
    print("AGRUPACIÓN HORARIA DEVUELTA POR EL PIPELINE CON OFFSET -4 HORAS:")
    print("==========================================================================")
    for r in res:
        print(f"  • Hora {r['_id']:02d}:00 -> Total Venta Neta: Bs. {float(str(r['total'])):,.2f}")

if __name__ == '__main__':
    asyncio.run(forensic_timezone_test())
