import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from datetime import datetime, date, timezone
import pandas as pd
import json

async def run_14steps_audit():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    print("==========================================================================================")
    print(" PASO 1: MONGODB - AUDITORÍA DE REGISTROS DE VENTAS EN VIVO DE HOY (06/08/2026)")
    print("==========================================================================================")

    ts_today = pd.Timestamp("2026-08-06", tz="America/La_Paz")
    start_utc_today = ts_today.tz_convert("UTC").to_pydatetime()
    end_utc_today = (ts_today + pd.Timedelta(days=1)).tz_convert("UTC").to_pydatetime()

    # Buscar ventas de hoy 06/08/2026 en 'sales'
    sales_query = {
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc_today, "$lt": end_utc_today},
        "anulada": {"$ne": True}
    }

    all_sales_today = await db.sales.find(sales_query).sort("created_at", 1).to_list(1000)

    # También buscar sin filtro de rango de fecha para ver todas las ventas en la colección 'sales'
    all_sales_db = await db.sales.find({"tenant_id": tenant_id, "anulada": {"$ne": True}}).sort("created_at", -1).to_list(100)

    print(f"Query MongoDB enviada: {sales_query}")
    print(f"Total ventas encontradas para la fecha local 06/08/2026 en rango UTC ({start_utc_today} a {end_utc_today}): {len(all_sales_today)}")
    print(f"Total ventas globales más recientes en coleccion 'sales': {len(all_sales_db)}")

    sucs = await db.sucursales.find({"tenant_id": tenant_id}).to_list(100)
    suc_map = {str(s["_id"]): s.get("nombre") for s in sucs}

    print("\n--------------------------------------------------------------------------------------------------------------------------------------------------")
    print(f"{'#':<3} | {'_id':<24} | {'created_at (BD UTC)':<27} | {'Hora UTC':<8} | {'Hora Local Bolivia (UTC-4)':<26} | {'Monto Neto (Bs.)':<16} | {'Sucursal':<15}")
    print("--------------------------------------------------------------------------------------------------------------------------------------------------")

    sample_list = all_sales_today if all_sales_today else all_sales_db[:30]

    for idx, s in enumerate(sample_list, 1):
        ca = s.get("created_at")
        sid = str(s.get("sucursal_id"))
        sname = suc_map.get(sid, sid)
        
        utc_hour_str = ca.strftime("%H:%M:%S") if isinstance(ca, datetime) else "N/A"
        utc_h = ca.hour if isinstance(ca, datetime) else 0

        # Hora Bolivia
        if isinstance(ca, datetime):
            local_ts = pd.Timestamp(ca).tz_localize("UTC").tz_convert("America/La_Paz")
            local_str = local_ts.strftime("%Y-%m-%d %H:%M:%S (-04:00)")
            local_h = local_ts.hour
        else:
            local_str = "N/A"
            local_h = 0

        # Monto neto
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

        net_total = total_val - disc_val

        print(f"{idx:<3} | {str(s['_id']):<24} | {str(ca):<27} | {utc_hour_str:<8} | {local_str:<26} | Bs. {net_total:>12,.2f} | {sname:<15}")

    print("\n==========================================================================================")
    print(" PASO 2 & 3 & 4: CAMPO UTILIZADO, CÓDIGO DEL BACKEND Y PIPELINE DE AGREGACIÓN")
    print("==========================================================================================")

    from app.services.hourly_multiyear_service import _build_sucursal_filter, _fetch_day_hourly_sales, get_hourly_multiyear

    suc_filters = await _build_sucursal_filter(db, tenant_id, None)

    print("\n2.1. Filtros de sucursal construidos:")
    print(json.dumps(suc_filters, indent=2, default=str))

    # Probar pipeline de agregación exacto en MongoDB
    tz_offset_ms = -4 * 3600 * 1000
    match_stage = {
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc_today, "$lt": end_utc_today},
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
                "total": {"$sum": "$monto_neto"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]

    print("\n3.1. Aggregation Pipeline ejecutado en MongoDB:")
    print(json.dumps(pipeline, indent=2, default=str))

    agg_res = await db.sales.aggregate(pipeline).to_list(100)
    print("\n3.2. Resultado del Aggregation Pipeline:")
    print(json.dumps(agg_res, indent=2, default=str))

    print("\n==========================================================================================")
    print(" PASO 8 & 9: JSON EXACTO DEVUELTO POR `get_hourly_multiyear` PARA HOY (06/08/2026)")
    print("==========================================================================================")

    res_service = await get_hourly_multiyear(tenant_id, date(2026, 8, 6), None)
    print(json.dumps(res_service, indent=2, default=str))

    print("\n==========================================================================================")
    print(" PASO 9: RASTREO (TRACE) PASO A PASO DE UNA VENTA ESPECÍFICA DE HOY")
    print("==========================================================================================")

    if all_sales_today:
        target_sale = all_sales_today[0]
        t_id = str(target_sale["_id"])
        t_ca = target_sale["created_at"]
        t_utc_hour = t_ca.hour
        t_local_ts = pd.Timestamp(t_ca).tz_localize("UTC").tz_convert("America/La_Paz")
        t_local_hour = t_local_ts.hour
        t_total = float(str(target_sale["total"]))

        print(f"• Venta rastreada: ID = {t_id}")
        print(f"  1. MongoDB created_at (UTC): {t_ca} -> Hora UTC = {t_utc_hour:02d}:00")
        print(f"  2. Hora Local Bolivia real: {t_local_ts} -> Hora Local = {t_local_hour:02d}:00")
        print(f"  3. Aggregation $dateAdd (-4h) -> Hora Agrupada = {t_local_hour:02d}:00")

        # Buscar esa hora en el JSON devuelto por la API
        target_hour_str = f"{t_local_hour:02d}:00"
        hour_data = next((h for h in res_service.get("horas", []) if h["hora"] == target_hour_str), None)
        print(f"  4. JSON enviado al Frontend para la hora '{target_hour_str}':")
        print(f"     {json.dumps(hour_data, indent=6)}")
        print(f"  5. Monto Neto registrado en esa hora: Bs. {hour_data.get('real') if hour_data else 0.0}")

if __name__ == '__main__':
    asyncio.run(run_14steps_audit())
