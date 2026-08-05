import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import get_raw_db, init_db
from datetime import datetime, timezone
import pandas as pd

async def report_date():
    await init_db()
    db = await get_raw_db()

    target_date_str = "2026-04-03"
    
    # Rango en hora Bolivia (UTC-4)
    start_local = pd.Timestamp("2026-04-03 00:00:00", tz="America/La_Paz")
    end_local = pd.Timestamp("2026-04-03 23:59:59.999", tz="America/La_Paz")
    
    start_utc = start_local.tz_convert("UTC").to_pydatetime()
    end_utc = end_local.tz_convert("UTC").to_pydatetime()

    def to_f(v):
        return float(str(v or 0))

    print(f"=== BUSCANDO REGISTROS PARA EL {target_date_str} ===")
    print(f"Rango UTC: {start_utc} a {end_utc}\n")

    # 1. Ventas en colección 'sales' (POS)
    sales_list = await db.sales.find({
        "created_at": {"$gte": start_utc, "$lte": end_utc},
        "anulada": {"$ne": True},
        "estado": {"$ne": "anulado"}
    }).to_list(1000)

    print(f"--- COLECCIÓN 'sales' (POS en vivo) ---")
    print(f"Total registros encontrados: {len(sales_list)}")
    if sales_list:
        total_bs = sum(to_f(s.get("total")) for s in sales_list)
        print(f"Monto total: Bs. {total_bs:,.2f}")
        
        # Desglose por sucursal
        suc_map = {}
        for s in sales_list:
            suc = str(s.get("sucursal_id") or s.get("sucursal") or "Sin Sucursal")
            suc_map[suc] = suc_map.get(suc, 0.0) + to_f(s.get("total"))
        print("Desglose por sucursal en POS:")
        for k, v in suc_map.items():
            print(f"  • {k}: Bs. {v:,.2f}")

    # 2. Ventas en colección 'ventas_historicas_crudas'
    # Buscar con rango de fecha_transaccion tanto Naive como Aware
    start_naive = datetime(2026, 4, 3, 0, 0, 0)
    end_naive = datetime(2026, 4, 3, 23, 59, 59)

    hist_list = await db.ventas_historicas_crudas.find({
        "$or": [
            {"fecha_transaccion": {"$gte": start_naive, "$lte": end_naive}},
            {"fecha_transaccion": {"$gte": start_utc, "$lte": end_utc}},
            {"fecha_transaccion": {"$regex": "^2026-04-03"}}
        ]
    }).to_list(1000)

    print(f"\n--- COLECCIÓN 'ventas_historicas_crudas' ---")
    print(f"Total registros encontrados: {len(hist_list)}")
    if hist_list:
        total_hist = sum(to_f(h.get("monto_total_bs") or h.get("total") or 0) for h in hist_list)
        print(f"Monto total: Bs. {total_hist:,.2f}")
        
        suc_hist = {}
        for h in hist_list:
            suc = str(h.get("sucursal") or "Sin Sucursal")
            suc_hist[suc] = suc_hist.get(suc, 0.0) + to_f(h.get("monto_total_bs") or h.get("total") or 0)
        print("Desglose por sucursal en históricas:")
        for k, v in suc_hist.items():
            print(f"  • {k}: Bs. {v:,.2f}")

    # 3. Muestra de transacciones individuales si existen
    all_records = sales_list if sales_list else hist_list
    if all_records:
        print(f"\n--- DETALLE DE TRANSACCIONES ({target_date_str}) ---")
        for idx, item in enumerate(all_records[:10], 1):
            f_val = item.get("created_at") or item.get("fecha_transaccion")
            m_val = to_f(item.get("total") or item.get("monto_total_bs"))
            suc_val = item.get("sucursal_id") or item.get("sucursal")
            print(f"  {idx}. Fecha: {f_val} | Sucursal: {suc_val} | Monto: Bs. {m_val:,.2f}")
    else:
        print(f"\nNo existen ventas ni registros guardados para la fecha {target_date_str}.")

if __name__ == '__main__':
    asyncio.run(report_date())
