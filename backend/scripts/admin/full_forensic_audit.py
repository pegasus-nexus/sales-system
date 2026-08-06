import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime, date, timezone
import pandas as pd

async def run_full_forensic_audit():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    print("==========================================================================================")
    print(" PASO 1: AUDITORÍA DE REGISTROS DE BASE DE DATOS (sales vs ventas_historicas_crudas)")
    print("==========================================================================================")

    # 1. Ventas de hoy 06/08/2026 en 'sales'
    ts_today = pd.Timestamp("2026-08-06", tz="America/La_Paz")
    start_utc_today = ts_today.tz_convert("UTC").to_pydatetime()
    end_utc_today = (ts_today + pd.Timedelta(days=1)).tz_convert("UTC").to_pydatetime()

    sales_today = await db.sales.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc_today, "$lt": end_utc_today},
        "anulada": {"$ne": True}
    }).sort("created_at", 1).to_list(500)

    print(f"\n1.1. BUSQUEDA EN 'sales' PARA HOY (06/08/2026):")
    print(f"     Rango UTC evaluado: {start_utc_today} a {end_utc_today}")
    print(f"     Total ventas encontradas para 06/08/2026: {len(sales_today)}")

    # 1.2. Ventas de ayer 05/08/2026 en 'sales'
    ts_yesterday = pd.Timestamp("2026-08-05", tz="America/La_Paz")
    start_utc_yest = ts_yesterday.tz_convert("UTC").to_pydatetime()
    end_utc_yest = (ts_yesterday + pd.Timedelta(days=1)).tz_convert("UTC").to_pydatetime()

    sales_yest = await db.sales.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc_yest, "$lt": end_utc_yest},
        "anulada": {"$ne": True}
    }).sort("created_at", 1).to_list(500)

    print(f"\n1.2. BUSQUEDA EN 'sales' PARA AYER (05/08/2026):")
    print(f"     Rango UTC evaluado: {start_utc_yest} a {end_utc_yest}")
    print(f"     Total ventas encontradas para 05/08/2026: {len(sales_yest)}")

    # Muestra de campos en 'sales'
    if sales_yest:
        s0 = sales_yest[0]
        print("\n1.3. EJEMPLO REAL DE DOCUMENTO EN 'sales':")
        print(f"     _id: {s0.get('_id')}")
        print(f"     created_at: {s0.get('created_at')} (type: {type(s0.get('created_at'))})")
        print(f"     total: {s0.get('total')} (type: {type(s0.get('total'))})")
        print(f"     descuento: {s0.get('descuento')}")

    # Muestra de campos en 'ventas_historicas_crudas'
    hist_sample = await db.ventas_historicas_crudas.find_one({"tenant_id": tenant_id})
    if hist_sample:
        print("\n1.4. EJEMPLO REAL DE DOCUMENTO EN 'ventas_historicas_crudas':")
        print(f"     _id: {hist_sample.get('_id')}")
        print(f"     fecha_transaccion: {hist_sample.get('fecha_transaccion')} (type: {type(hist_sample.get('fecha_transaccion'))})")
        print(f"     monto_total_bs: {hist_sample.get('monto_total_bs')} (type: {type(hist_sample.get('monto_total_bs'))})")
        print(f"     sucursal: {hist_sample.get('sucursal')}")

    print("\n==========================================================================================")
    print(" PASO 5 & 6: REVISIÓN DE CÓMO `get_hourly_multiyear` CALCULA EL RANGO PARA EL DÍA ACTUAL")
    print("==========================================================================================")

    from app.services.hourly_multiyear_service import get_hourly_multiyear, _build_sucursal_filter, _fetch_day_hourly_sales

    # Probar llamado directo a get_hourly_multiyear para HOY (06/08/2026)
    res_today = await get_hourly_multiyear(tenant_id, date(2026, 8, 6), None)
    print("Resultado get_hourly_multiyear para fecha_referencia = 2026-08-06 (HOY):")
    print("  meta:", res_today.get("meta"))
    print("  total horas registradas en 'horas':", len([h for h in res_today.get("horas", []) if h["real"] > 0]))

    # Probar llamado directo para AYER (05/08/2026)
    res_yest = await get_hourly_multiyear(tenant_id, date(2026, 8, 5), None)
    print("\nResultado get_hourly_multiyear para fecha_referencia = 2026-08-05 (AYER):")
    print("  meta:", res_yest.get("meta"))
    print("  total horas registradas en 'horas':", len([h for h in res_yest.get("horas", []) if h["real"] > 0]))

    print("\n==========================================================================================")
    print(" PASO 7: TABLA DIAGNÓSTICA DE PROCESAMIENTO HORARIO (Sales del 05/08/2026)")
    print("==========================================================================================")

    suc_filters = await _build_sucursal_filter(db, tenant_id, None)
    h_dict_sales, cnt_sales = await _fetch_day_hourly_sales(db, tenant_id, date(2026, 8, 5), suc_filters)

    print(f"{'Hora BD (created_at UTC)':<25} | {'Hora Local (America/La_Paz)':<28} | {'Hora Agrupada':<15} | {'Venta Neta':<10}")
    print("-" * 85)

    sum_hourly = 0.0
    for s in sales_yest[:15]:
        ca = s.get("created_at")
        utc_str = ca.strftime('%Y-%m-%d %H:%M:%S UTC')
        local_ts = pd.Timestamp(ca).tz_localize("UTC").tz_convert("America/La_Paz")
        local_str = local_ts.strftime('%Y-%m-%d %H:%M:%S (-04:00)')
        group_hour = f"{local_ts.hour:02d}:00"

        # Venta neta
        total_val = float(str(s.get("total", 0)))
        disc_info = s.get("descuento")
        disc_val = 0.0
        if disc_info and isinstance(disc_info, dict):
            d_val = float(str(disc_info.get("valor", 0)))
            d_tipo = disc_info.get("tipo")
            if d_tipo == "MONTO":
                disc_val = d_val
            elif d_tipo == "PORCENTAJE":
                disc_val = total_val * (d_val / 100.0)

        net_val = total_val - disc_val
        sum_hourly += net_val

        print(f"{utc_str:<25} | {local_str:<28} | {group_hour:<15} | Bs. {net_val:>7,.2f}")

    print(f"\nSuma total Venta Neta calculada del día 05/08/2026: Bs. {sum([v for v in h_dict_sales.values()]):,.2f}")

if __name__ == '__main__':
    asyncio.run(run_full_forensic_audit())
