import asyncio
import sys
import os
from datetime import datetime, date, time, timezone, timedelta
import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db
from app.services.hourly_multiyear_service import get_hourly_multiyear, _same_day_prev_year

async def run_full_forensic_audit():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    print("==========================================================================")
    print("AUDITORIA FORENSE COMPLETA END-TO-END DE COMPARATIVA HORARIA MULTI-ANO")
    print("==========================================================================")

    # -------------------------------------------------------------------------
    # PROBLEMA 1: DATOS DIRECTOS DE MONGODB PARA HOY 11/08/2026
    # -------------------------------------------------------------------------
    print("\n--- PROBLEMA 1: CONSULTA DIRECTA DE HOY 11/08/2026 EN MONGODB ---")

    # Definir 11/08/2026 en Bolivia Time (UTC-4)
    # 11/08/2026 00:00:00 Bolivia = 11/08/2026 04:00:00 UTC
    # 11/08/2026 23:59:59 Bolivia = 12/08/2026 03:59:59 UTC
    bo_tz = timezone(timedelta(hours=-4))
    
    start_bo = datetime(2026, 8, 11, 0, 0, 0, tzinfo=bo_tz)
    end_bo = datetime(2026, 8, 11, 23, 59, 59, 999999, tzinfo=bo_tz)

    start_utc = start_bo.astimezone(timezone.utc)
    end_utc = end_bo.astimezone(timezone.utc)

    # Consulta por created_at en UTC
    sales_today_utc = await db.sales.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc, "$lte": end_utc},
        "anulada": {"$ne": True}
    }).sort("created_at", 1).to_list(1000)

    print(f"Rango UTC buscado en BD: {start_utc.isoformat()} a {end_utc.isoformat()}")
    print(f"Ventas encontradas hoy (11/08/2026): {len(sales_today_utc)} documentos")

    total_today = sum(float(str(s.get("total", 0))) for s in sales_today_utc)
    print(f"Importe Total Neto Venta Hoy (11/08/2026): Bs. {total_today:,.2f}")

    if sales_today_utc:
        first = sales_today_utc[0]
        last = sales_today_utc[-1]
        f_ca = first.get("created_at")
        l_ca = last.get("created_at")
        
        print("\n  • PRIMER REGISTRO DE HOY:")
        print(f"    - ID: {first['_id']}")
        print(f"    - total: Bs. {first.get('total')}")
        print(f"    - created_at (Raw PyMongo): {repr(f_ca)}")
        print(f"    - Tipo Python: {type(f_ca)}")
        if isinstance(f_ca, datetime):
            print(f"    - Hora UTC: {f_ca.strftime('%Y-%m-%d %H:%M:%S UTC')}")
            f_bo = f_ca.replace(tzinfo=timezone.utc).astimezone(bo_tz) if f_ca.tzinfo is None else f_ca.astimezone(bo_tz)
            print(f"    - Hora Bolivia (UTC-4): {f_bo.strftime('%Y-%m-%d %H:%M:%S %p')}")

        print("\n  • ÚLTIMO REGISTRO DE HOY HASTA AHORA:")
        print(f"    - ID: {last['_id']}")
        print(f"    - total: Bs. {last.get('total')}")
        print(f"    - created_at (Raw PyMongo): {repr(l_ca)}")
        if isinstance(l_ca, datetime):
            print(f"    - Hora UTC: {l_ca.strftime('%Y-%m-%d %H:%M:%S UTC')}")
            l_bo = l_ca.replace(tzinfo=timezone.utc).astimezone(bo_tz) if l_ca.tzinfo is None else l_ca.astimezone(bo_tz)
            print(f"    - Hora Bolivia (UTC-4): {l_bo.strftime('%Y-%m-%d %H:%M:%S %p')}")
    else:
        print("  ❌ NO se encontraron ventas de hoy 11/08/2026 en el rango UTC especificado.")

    # Muestreo amplio: Buscar ventas sin filtro de fecha en las últimas 48 horas en MongoDB
    recent_sales = await db.sales.find({
        "tenant_id": tenant_id
    }).sort("created_at", -1).limit(10).to_list(10)

    print("\n  • MUESTREO DE LAS ÚLTIMAS 10 VENTAS REGISTRADAS EN LA COLECCIÓN 'sales':")
    for r in recent_sales:
        ca = r.get("created_at")
        ca_bo_str = ca.replace(tzinfo=timezone.utc).astimezone(bo_tz).strftime('%Y-%m-%d %H:%M:%S') if isinstance(ca, datetime) else str(ca)
        tot_val = float(str(r.get("total", 0)))
        print(f"    ID: {r['_id']} | Total: Bs. {tot_val:>7.2f} | created_at UTC: {ca} | Bolivia Local: {ca_bo_str}")

    # -------------------------------------------------------------------------
    # PROBLEMA 2: COMPARAR MONGODB CONTRA EL KPI (Bs. 113.50)
    # -------------------------------------------------------------------------
    print("\n--- PROBLEMA 2: COMPARACIÓN DE MONGODB VS KPI DASHBOARD (Bs. 113.50) ---")
    print(f"Total Real en MongoDB para 11/08/2026 (Bolivia 00:00 - 23:59): Bs. {total_today:,.2f}")
    print("KPI reportado por la pantalla de usuario para hoy: Bs. 113.50")
    
    # ¿De dónde sale Bs. 113.50? Busquemos qué ventas suman exactamente Bs. 113.50 o en qué hora/fecha están
    sales_113 = [s for s in recent_sales if float(str(s.get("total", 0))) == 113.50]
    print(f"¿Existe una venta de Bs. 113.50? Encontradas: {len(sales_113)}")
    if sales_113:
        for s in sales_113:
            print(f"  Venta 113.50 -> ID: {s['_id']}, created_at UTC: {s.get('created_at')}")

    # Consultemos get_hourly_multiyear directamente para la fecha 2026-08-11
    res_today_service = await get_hourly_multiyear(
        tenant_id=tenant_id,
        fecha_referencia=date(2026, 8, 11),
        fecha_anio1=date(2025, 8, 12),
        fecha_anio2=date(2024, 8, 13),
        sucursal=None
    )
    meta_today = res_today_service.get("meta", {})
    horas_today = res_today_service.get("horas", [])

    print(f"Respuesta del backend service para 11/08/2026:")
    print(f"  • total_real (meta): Bs. {meta_today.get('total_real')}")
    print(f"  • docs_real (meta): {meta_today.get('docs_real')}")
    print(f"  • Suma de horas 'real': Bs. {sum(h['real'] for h in horas_today):,.2f}")
    for h in horas_today:
        if h['real'] > 0 or h['anio1'] > 0:
            print(f"    Hora {h['hora']} -> 2026 (Hoy): Bs. {h['real']:>7.2f} | 2025: Bs. {h['anio1']:>7.2f}")

    # -------------------------------------------------------------------------
    # PROBLEMA 3: FILTRO DE FECHA EN EL BACKEND SERVICE
    # -------------------------------------------------------------------------
    print("\n--- PROBLEMA 3: AUDITORÍA DE CONSTRUCCIÓN DEL RANGO DE FECHAS EN BACKEND ---")
    d0 = date(2026, 8, 11)
    start_local_pd = pd.Timestamp(d0, tz="America/La_Paz")
    end_local_pd = start_local_pd + pd.Timedelta(days=1)
    start_utc_pd = start_local_pd.tz_convert("UTC").to_pydatetime()
    end_utc_pd = end_local_pd.tz_convert("UTC").to_pydatetime()

    print(f"Fecha pedida: {d0}")
    print(f"  • start_local (America/La_Paz): {start_local_pd}")
    print(f"  • end_local   (America/La_Paz): {end_local_pd}")
    print(f"  • start_utc (Mongo match $gte): {start_utc_pd} (tzinfo: {start_utc_pd.tzinfo})")
    print(f"  • end_utc   (Mongo match $lt):  {end_utc_pd} (tzinfo: {end_utc_pd.tzinfo})")

    # -------------------------------------------------------------------------
    # PROBLEMA 5: TRAZABILIDAD PASO A PASO DE UN DOCUMENTO REAL (10/08/2026)
    # -------------------------------------------------------------------------
    print("\n--- PROBLEMA 5: TRAZA PASO A PASO DE UN REGISTRO REAL DE 10/08/2026 ---")
    doc_real = await db.sales.find_one({
        "tenant_id": tenant_id,
        "created_at": {"$gte": datetime(2026, 8, 10, 13, 0, 0), "$lt": datetime(2026, 8, 10, 13, 10, 0)}
    })
    
    if doc_real:
        print(f"PASO 1 [MongoDB Documento Raw]:")
        print(f"  - _id: {doc_real['_id']}")
        print(f"  - total: Bs. {doc_real.get('total')}")
        print(f"  - created_at BSON: {repr(doc_real.get('created_at'))}")
        
        # Probar agregación Mongo para este documento individual
        pipe_single = [
            {"$match": {"_id": doc_real["_id"]}},
            {"$project": {
                "created_at": 1,
                "hour_utc_direct": {"$hour": "$created_at"},
                "created_at_sub_4h": {
                    "$dateSubtract": {
                        "startDate": "$created_at",
                        "unit": "hour",
                        "amount": 4
                    }
                }
            }},
            {"$project": {
                "created_at": 1,
                "hour_utc_direct": 1,
                "created_at_sub_4h": 1,
                "hour_after_sub": {"$hour": "$created_at_sub_4h"}
            }}
        ]
        res_single = await db.sales.aggregate(pipe_single).to_list(1)
        if res_single:
            s_res = res_single[0]
            print(f"PASO 2 [MongoDB Aggregation Result]:")
            print(f"  - hour_utc_direct (sin resta): {s_res.get('hour_utc_direct')} (Representa 13:00 UTC)")
            print(f"  - created_at_sub_4h: {s_res.get('created_at_sub_4h')}")
            print(f"  - hour_after_sub (con -4h): {s_res.get('hour_after_sub')} (Representa 09:00 AM Local)")
    else:
        print("  - No se encontró documento de prueba en 10/08 13:00 UTC")

    # -------------------------------------------------------------------------
    # PROBLEMA 6 Y 8: FUENTES DE DATOS Y ALINEACIÓN MULTI-AÑO (DÍAS DE LA SEMANA)
    # -------------------------------------------------------------------------
    print("\n--- PROBLEMA 6 Y 8: FUENTES DE DATOS Y ALINEACIÓN DE FECHAS ---")
    print("Regla de equivalencia histórica `_get_equivalent_historical_date`:")
    ref_11 = date(2026, 8, 11) # Martes
    eq_a1_11 = _same_day_prev_year(ref_11, 1)
    eq_a2_11 = _same_day_prev_year(ref_11, 2)
    print(f"Fecha Referencia: {ref_11} ({ref_11.strftime('%A')})")
    print(f"  -> Año -1 Equivalente: {eq_a1_11} ({eq_a1_11.strftime('%A')}) [364 días atrás = -52 semanas]")
    print(f"  -> Año -2 Equivalente: {eq_a2_11} ({eq_a2_11.strftime('%A')}) [728 días atrás = -104 semanas]")

    ref_10 = date(2026, 8, 10) # Lunes
    eq_a1_10 = _same_day_prev_year(ref_10, 1)
    eq_a2_10 = _same_day_prev_year(ref_10, 2)
    print(f"Fecha Referencia: {ref_10} ({ref_10.strftime('%A')})")
    print(f"  -> Año -1 Equivalente: {eq_a1_10} ({eq_a1_10.strftime('%A')}) [364 días atrás = -52 semanas]")
    print(f"  -> Año -2 Equivalente: {eq_a2_10} ({eq_a2_10.strftime('%A')}) [728 días atrás = -104 semanas]")

if __name__ == '__main__':
    asyncio.run(run_full_forensic_audit())
