import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime
import pandas as pd

async def audit_today():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    ts_today = pd.Timestamp("2026-08-06", tz="America/La_Paz")
    start_utc_today = ts_today.tz_convert("UTC").to_pydatetime()
    end_utc_today = (ts_today + pd.Timedelta(days=1)).tz_convert("UTC").to_pydatetime()

    sales_today = await db.sales.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc_today, "$lt": end_utc_today},
        "anulada": {"$ne": True}
    }).to_list(100)

    # Obtener sucursales
    sucs = await db.sucursales.find({"tenant_id": tenant_id}).to_list(100)
    suc_map = {str(s["_id"]): s.get("nombre") for s in sucs}

    print("==========================================================================")
    print("DETALLE DE LAS 7 VENTAS REGISTRADAS HOY (06/08/2026):")
    print("==========================================================================")

    from app.utils.date_utils import get_now_bolivia
    now_bo = get_now_bolivia()
    print(f"Hora actual Bolivia: {now_bo.strftime('%Y-%m-%d %H:%M:%S')} (Hour: {now_bo.hour})\n")

    for s in sales_today:
        ca = s.get("created_at")
        sid = str(s.get("sucursal_id"))
        sname = suc_map.get(sid, sid)
        local_ts = pd.Timestamp(ca).tz_localize("UTC").tz_convert("America/La_Paz")
        local_hour = local_ts.hour
        total = float(str(s.get("total", 0)))
        print(f"Sale ID: {str(s['_id']):<24} | Sucursal: {sname:<18} | UTC: {ca} | Local: {local_ts.strftime('%H:%M:%S')} (Hora {local_hour:02d}) | Total: Bs. {total:,.2f}")

if __name__ == '__main__':
    asyncio.run(audit_today())
