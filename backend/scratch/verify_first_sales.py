import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db
from app.utils.date_utils import get_day_range_bolivia, utc_to_bolivia

async def main():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    sucursales = await db.sucursales.find({"tenant_id": tenant_id}).to_list(100)
    suc_map = {str(s["_id"]): s.get("nombre") for s in sucursales}

    start_utc, end_utc = get_day_range_bolivia("2026-08-20")

    docs = await db.sales.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc, "$lte": end_utc}
    }).sort("created_at", 1).to_list(20)

    print(f"=== PRIMERAS 15 VENTAS DEL DÍA (20/08/2026) CRONOLÓGICAMENTE ===")
    print(f"{'Hora Bolivia':<15} | {'Ticket #':<10} | {'Monto':<8} | {'Sucursal ID':<25} | {'Sucursal Nombre Mapped':<25} | {'Cajero':<25}")
    print("-" * 115)

    for d in docs:
        dt_utc = d.get("created_at")
        dt_bol = utc_to_bolivia(dt_utc) if dt_utc else None
        tot = float(str(d.get("total", 0)))
        t_id = str(d["_id"])[-6:].upper()
        s_id = str(d.get("sucursal_id", ""))
        s_name = suc_map.get(s_id, d.get("sucursal_nombre", "Desconocido"))
        cajero = d.get("cashier_name") or d.get("cajero_nombre") or d.get("usuario_nombre") or "N/A"
        
        print(f"{dt_bol.strftime('%H:%M:%S'):<15} | #{t_id:<9} | {tot:>6.2f} | {s_id:<25} | {s_name:<25} | {cajero:<25}")

asyncio.run(main())
