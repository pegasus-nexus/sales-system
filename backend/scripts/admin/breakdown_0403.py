import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime
import pandas as pd

async def breakdown_0403():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    target_date = pd.Timestamp("2026-04-03", tz="America/La_Paz")
    start_utc = target_date.tz_convert("UTC").to_pydatetime()
    end_utc = (target_date + pd.Timedelta(days=1)).tz_convert("UTC").to_pydatetime()

    def to_f(v):
        return float(str(v or 0))

    # Obtener todas las sucursales para mapear IDs a Nombres
    sucs = await db.sucursales.find({"tenant_id": tenant_id}).to_list(100)
    suc_map = {str(s["_id"]): s.get("nombre") for s in sucs}

    pipeline = [
        {"$match": {
            "tenant_id": tenant_id,
            "created_at": {"$gte": start_utc, "$lt": end_utc},
            "anulada": {"$ne": True},
            "estado": {"$ne": "anulado"}
        }},
        {"$group": {
            "_id": "$sucursal_id",
            "total_bs": {"$sum": "$total"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"total_bs": -1}}
    ]

    res = await db.sales.aggregate(pipeline).to_list(100)

    print("=== DESGLOSE EXACTO POR SUCURSAL DEL 03/04/2026 (VIERNES SANTO) ===")
    total_general_bs = 0.0
    total_general_cnt = 0

    for r in res:
        sid_raw = str(r["_id"])
        sname = suc_map.get(sid_raw, sid_raw)
        bs = to_f(r["total_bs"])
        cnt = r["count"]
        total_general_bs += bs
        total_general_cnt += cnt
        ticket = bs / cnt if cnt > 0 else 0
        print(f"• Sucursal: {sname:<25} | Facturación: Bs. {bs:>10,.2f} | Transacciones: {cnt:>3} | Ticket Medio: Bs. {ticket:>7,.2f}")

    print("-" * 80)
    print(f"TOTAL GENERAL 03/04/2026: Bs. {total_general_bs:,.2f} | Transacciones: {total_general_cnt}")

if __name__ == '__main__':
    asyncio.run(breakdown_0403())
