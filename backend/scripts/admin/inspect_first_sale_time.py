import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime, date
import pandas as pd

async def inspect_first_sales():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    # Lunes 10-08-2026 en sales
    ts_2026 = pd.Timestamp("2026-08-10", tz="America/La_Paz")
    start_utc_2026 = ts_2026.tz_convert("UTC").to_pydatetime()
    end_utc_2026 = (ts_2026 + pd.Timedelta(days=1)).tz_convert("UTC").to_pydatetime()

    sales_2026 = await db.sales.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc_2026, "$lt": end_utc_2026},
        "anulada": {"$ne": True}
    }).sort("created_at", 1).to_list(10)

    print("==========================================================================")
    print("PRIMERAS VENTAS REGISTRADAS EL LUNES 10-08-2026 EN POS ('sales'):")
    print("==========================================================================")
    for s in sales_2026:
        ca = s.get("created_at")
        local_ts = pd.Timestamp(ca).tz_localize("UTC").tz_convert("America/La_Paz")
        total = float(str(s.get("total", 0)))
        print(f"  • Sale ID: {str(s['_id'])} | UTC: {ca} | Local Bolivia: {local_ts.strftime('%Y-%m-%d %H:%M:%S')} (Hora {local_ts.hour:02d}:{local_ts.minute:02d}) | Total: Bs. {total:,.2f}")

    # Lunes 11-08-2025 en ventas_historicas_crudas
    dt_start_2025 = datetime(2025, 8, 11, 0, 0, 0)
    dt_end_2025 = datetime(2025, 8, 11, 23, 59, 59)
    hist_2025 = await db.ventas_historicas_crudas.find({
        "tenant_id": tenant_id,
        "fecha_transaccion": {"$gte": dt_start_2025, "$lte": dt_end_2025}
    }).sort("fecha_transaccion", 1).to_list(10)

    print("\n==========================================================================")
    print("PRIMERAS VENTAS REGISTRADAS EL LUNES 11-08-2025 EN HISTÓRICO:")
    print("==========================================================================")
    for h in hist_2025:
        ft = h.get("fecha_transaccion")
        monto = float(str(h.get("monto_total_bs", 0)))
        pname = str(h.get("nombre_producto") or '')
        print(f"  • Hist ID: {str(h['_id'])} | fecha_transaccion: {ft} | Producto: {pname[:25]:<25} | Monto: Bs. {monto:,.2f}")

if __name__ == '__main__':
    asyncio.run(inspect_first_sales())
