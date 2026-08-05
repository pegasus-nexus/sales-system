import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import date
import pandas as pd

async def test_net_calc():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    target_date = date(2026, 4, 3)

    tz_offset_ms = -4 * 3600 * 1000

    start_local = pd.Timestamp(target_date, tz="America/La_Paz")
    end_local = start_local + pd.Timedelta(days=1)
    start_utc = start_local.tz_convert("UTC").to_pydatetime()
    end_utc = end_local.tz_convert("UTC").to_pydatetime()

    match_stage = {
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc, "$lt": end_utc},
        "estado": {"$ne": "anulado"},
        "anulada": {"$ne": True}
    }

    pipeline = [
        {"$match": match_stage},
        {
            "$project": {
                "created_at": 1,
                "monto_neto": {
                    "$cond": [
                        {"$gt": [{"$ifNull": ["$descuento.valor", 0]}, 0]},
                        {
                            "$cond": [
                                {"$eq": ["$descuento.tipo", "MONTO"]},
                                {"$subtract": [{"$toDouble": "$total"}, {"$toDouble": "$descuento.valor"}]},
                                {"$subtract": [
                                    {"$toDouble": "$total"},
                                    {"$multiply": [{"$toDouble": "$total"}, {"$divide": [{"$toDouble": "$descuento.valor"}, 100]}]}
                                ]}
                            ]
                        },
                        {"$toDouble": "$total"}
                    ]
                }
            }
        },
        {
            "$group": {
                "_id": {
                    "$hour": {
                        "$dateAdd": {
                            "startDate": "$created_at",
                            "unit": "millisecond",
                            "amount": tz_offset_ms
                        }
                    }
                },
                "total": {"$sum": "$monto_neto"}
            }
        }
    ]

    res = await db.sales.aggregate(pipeline).to_list(100)
    print("Desglose Venta Neta para 03/04/2026:")
    total_neto = 0.0
    for r in sorted(res, key=lambda x: x["_id"]):
        v = float(str(r["total"]))
        total_neto += v
        print(f"  {r['_id']:02d}:00 -> Venta Neta: Bs. {v:,.2f}")

    print(f"\nTOTAL VENTA NETA 03/04/2026: Bs. {total_neto:,.2f}")

if __name__ == '__main__':
    asyncio.run(test_net_calc())
