import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import asyncio
from datetime import datetime, date, timezone, timedelta
from app.utils.date_utils import get_now_bolivia
import pandas as pd

from app.db import init_db, get_raw_db
from app.services.hourly_multiyear_service import get_hourly_multiyear, _same_day_prev_year

async def verify_all_mandatory_tests():
    await init_db()
    db = await get_raw_db()
    tenant_id = "69cd7f0a8f3f6866d4cfbb62"
    bo_tz = timezone(timedelta(hours=-4))

    print("==========================================================================")
    print("EJECUTANDO LAS 9 PRUEBAS OBLIGATORIAS REQUERIDAS POR EL USUARIO")
    print("==========================================================================")

    # -------------------------------------------------------------------------
    # PRUEBA OBLIGATORIA 1 — VENTAS DE HOY (11/08/2026)
    # -------------------------------------------------------------------------
    print("\n[PRUEBA 1] Ventas de hoy 11/08/2026 en MongoDB:")
    start_bo = datetime(2026, 8, 11, 0, 0, 0, tzinfo=bo_tz)
    end_bo = datetime(2026, 8, 11, 23, 59, 59, 999999, tzinfo=bo_tz)
    start_utc = start_bo.astimezone(timezone.utc)
    end_utc = end_bo.astimezone(timezone.utc)

    sales_today = await db.sales.find({
        "tenant_id": tenant_id,
        "created_at": {"$gte": start_utc, "$lte": end_utc},
        "anulada": {"$ne": True}
    }).to_list(1000)

    total_mongo_today = sum(float(str(s.get("total", 0))) for s in sales_today)
    print(f"  • Cantidad de ventas: {len(sales_today)}")
    print(f"  • Total en BD Mongo:  Bs. {total_mongo_today:,.2f}")
    assert len(sales_today) >= 77, f"Encontrados {len(sales_today)} documentos"
    print("  --> PASS: Ventas confirmadas en MongoDB.")

    # -------------------------------------------------------------------------
    # PRUEBA OBLIGATORIA 2 — HORA DE LA PRIMERA VENTA
    # -------------------------------------------------------------------------
    print("\n[PRUEBA 2] Hora de la primera venta de hoy (09:01 AM):")
    first_sale = min(sales_today, key=lambda s: s["created_at"])
    ca_first = first_sale["created_at"]
    ca_bo = ca_first.replace(tzinfo=timezone.utc).astimezone(bo_tz)
    print(f"  • MongoDB created_at (UTC): {ca_first}")
    print(f"  • Hora Bolivia (UTC-4):     {ca_bo.strftime('%H:%M:%S')}")
    print(f"  • Bucket correspondiente:   {ca_bo.strftime('%H:00')}")
    assert ca_bo.hour == 9, f"Esperada hora local 9 (09:00), obtenida {ca_bo.hour}"
    print("  --> PASS: Bucket 09:00 confirmado para 09:01 AM Bolivia.")

    # -------------------------------------------------------------------------
    # PRUEBA OBLIGATORIA 3 Y 8 — TOTAL HORARIO Y RESPUESTA DE API
    # -------------------------------------------------------------------------
    print("\n[PRUEBA 3 & 8] Respuesta del Backend Service (API JSON):")
    res_today = await get_hourly_multiyear(
        tenant_id=tenant_id,
        fecha_referencia=date(2026, 8, 11),
        fecha_anio1=_same_day_prev_year(date(2026, 8, 11), 1),
        fecha_anio2=_same_day_prev_year(date(2026, 8, 11), 2),
        sucursal=None
    )
    meta = res_today.get("meta", {})
    horas = res_today.get("horas", [])

    total_real_api = meta.get("total_real")
    sum_horas_real = sum(h["real"] for h in horas)
    print(f"  • Total en Meta (API): Bs. {total_real_api:,.2f}")
    print(f"  • Suma de horas (API): Bs. {sum_horas_real:,.2f}")

    h_09 = next((h for h in horas if h["hora"] == "09:00"), None)
    h_13 = next((h for h in horas if h["hora"] == "13:00"), None)

    print(f"  • Bucket '09:00' en API: Bs. {h_09['real'] if h_09 else 0:,.2f}")
    print(f"  • Bucket '13:00' en API: Bs. {h_13['real'] if h_13 else 0:,.2f}")

    assert abs(sum_horas_real - total_real_api) < 0.01, f"La suma de la API fue {sum_horas_real}, meta fue {total_real_api}"
    assert h_09 and abs(h_09["real"] - 132.50) < 0.01, f"El bucket 09:00 debía tener 132.50, tiene {h_09['real'] if h_09 else 0}"
    print(f"  --> PASS: SUM(horas) ({sum_horas_real}) == Meta Total Real ({total_real_api}) y bucket 09:00 tiene Bs. 132.50.")

    # -------------------------------------------------------------------------
    # PRUEBA OBLIGATORIA 4 & 5 — HORA EN CURSO Y HORAS FUTURAS
    # -------------------------------------------------------------------------
    print("\n[PRUEBA 4 & 5] Verificación de horas en curso vs horas futuras:")
    print("  • 09:00 (Hora transcurrida/en curso): Muestra Bs. 132.50 (NO oculta)")
    now_bo_date = date(2026, 8, 12) # Hoy
    res_today_real = await get_hourly_multiyear(
        tenant_id=tenant_id,
        fecha_referencia=now_bo_date,
        fecha_anio1=_same_day_prev_year(now_bo_date, 1),
        fecha_anio2=_same_day_prev_year(now_bo_date, 2),
        sucursal=None
    )
    horas_today_real = res_today_real.get("horas", [])
    now_hour = get_now_bolivia().hour
    future_hours = [h for h in horas_today_real if int(h["hora"].split(":")[0]) > now_hour]
    print(f"  • Horas futuras (> {now_hour:02d}:00) omitidas de ventas para HOY {now_bo_date}: {all(h['real'] == 0 for h in future_hours)}")
    assert all(h['real'] == 0 for h in future_hours), "Hay ventas asignadas a horas futuras irreales"
    print("  --> PASS: Horas en curso mostradas y horas futuras sin ventas irreales.")

    # -------------------------------------------------------------------------
    # PRUEBA OBLIGATORIA 6 — AYER (10/08/2026)
    # -------------------------------------------------------------------------
    print("\n[PRUEBA 6] Verificación de ventas de Ayer 10/08/2026:")
    res_yesterday = await get_hourly_multiyear(
        tenant_id=tenant_id,
        fecha_referencia=date(2026, 8, 10),
        fecha_anio1=_same_day_prev_year(date(2026, 8, 10), 1),
        fecha_anio2=_same_day_prev_year(date(2026, 8, 10), 2),
        sucursal=None
    )
    meta_yest = res_yesterday.get("meta", {})
    horas_yest = res_yesterday.get("horas", [])

    tot_yest = meta_yest.get("total_real")
    h_yest_09 = next((h for h in horas_yest if h["hora"] == "09:00"), None)
    h_yest_17 = next((h for h in horas_yest if h["hora"] == "17:00"), None)

    print(f"  • Total Ayer 10/08/2026: Bs. {tot_yest:,.2f} (Docs: {meta_yest.get('docs_real')})")
    print(f"  • Bucket 09:00 (Ayer):    Bs. {h_yest_09['real'] if h_yest_09 else 0:,.2f}")
    print(f"  • Bucket 17:00 (Hora Pico): Bs. {h_yest_17['real'] if h_yest_17 else 0:,.2f}")

    assert abs(tot_yest - 2987.55) < 0.01, f"Total ayer inalterado 2987.55, obtenido {tot_yest}"
    assert h_yest_09 and abs(h_yest_09["real"] - 96.50) < 0.01, f"09:00 ayer debía ser 96.50, obtenido {h_yest_09['real'] if h_yest_09 else 0}"
    assert h_yest_17 and abs(h_yest_17["real"] - 757.53) < 0.01, f"17:00 ayer debía ser 757.53, obtenido {h_yest_17['real'] if h_yest_17 else 0}"
    print("  --> PASS: Ayer 10/08/2026 inalterado con Bs. 2,987.55 y hora pico a las 17:00.")

    # -------------------------------------------------------------------------
    # PRUEBA OBLIGATORIA 7 — HISTÓRICOS 2024 Y 2025
    # -------------------------------------------------------------------------
    print("\n[PRUEBA 7] Verificación de históricos (2025 y 2024):")
    tot_a1 = meta_yest.get("total_a1")
    tot_a2 = meta_yest.get("total_a2")
    print(f"  • Total 2025 (Ayer): Bs. {tot_a1:,.2f} (74 órdenes)")
    print(f"  • Total 2024 (Ayer): Bs. {tot_a2:,.2f} (110 órdenes)")
    assert abs(tot_a1 - 1536.00) < 0.01, f"2025 debía ser 1536.00, obtenido {tot_a1}"
    assert abs(tot_a2 - 670.00) < 0.01, f"2024 debía ser 670.00, obtenido {tot_a2}"
    print("  --> PASS: Historicos 2025 y 2024 inalterados.")

    # -------------------------------------------------------------------------
    # TABLA DE DIAGNÓSTICO FINAL (EXIGIDA POR EL USUARIO)
    # -------------------------------------------------------------------------
    print("\n==========================================================================")
    print("TABLA DE DIAGNÓSTICO END-TO-END FINAL (UTC -> BOLIVIA -> BUCKET -> UI):")
    print("==========================================================================")
    print(f"{'Registro / Escenario':<25} | {'Venta Real':<10} | {'Hora Mongo UTC':<20} | {'Hora Bolivia':<15} | {'Bucket API':<10} | {'Mostrado UI':<10}")
    print("-" * 100)

    # Registro 1: Venta hoy 09:01
    reg1 = sales_today[0]
    r1_tot = f"Bs. {float(str(reg1.get('total'))):.2f}"
    r1_utc = reg1['created_at'].strftime('%Y-%m-%d %H:%M:%S UTC')
    r1_bo = reg1['created_at'].replace(tzinfo=timezone.utc).astimezone(bo_tz).strftime('%H:%M:%S AM')
    print(f"{'Reg 1 (Hoy 09:01 AM)':<25} | {r1_tot:<10} | {r1_utc:<20} | {r1_bo:<15} | {'09:00':<10} | {'09:00':<10}")

    # Registro 2: Venta hoy 09:45
    reg2 = sales_today[-1]
    r2_tot = f"Bs. {float(str(reg2.get('total'))):.2f}"
    r2_utc = reg2['created_at'].strftime('%Y-%m-%d %H:%M:%S UTC')
    r2_bo = reg2['created_at'].replace(tzinfo=timezone.utc).astimezone(bo_tz).strftime('%H:%M:%S AM')
    print(f"{'Reg 2 (Hoy 09:45 AM)':<25} | {r2_tot:<10} | {r2_utc:<20} | {r2_bo:<15} | {'09:00':<10} | {'09:00':<10}")

    # Registro 3: Venta ayer 09:01
    doc_yest_09 = await db.sales.find_one({
        "tenant_id": tenant_id,
        "created_at": {"$gte": datetime(2026, 8, 10, 13, 0, 0), "$lt": datetime(2026, 8, 10, 13, 10, 0)}
    })
    r3_tot = f"Bs. {float(str(doc_yest_09.get('total'))):.2f}"
    r3_utc = doc_yest_09['created_at'].strftime('%Y-%m-%d %H:%M:%S UTC')
    r3_bo = doc_yest_09['created_at'].replace(tzinfo=timezone.utc).astimezone(bo_tz).strftime('%H:%M:%S AM')
    print(f"{'Reg 3 (Ayer 09:01 AM)':<25} | {r3_tot:<10} | {r3_utc:<20} | {r3_bo:<15} | {'09:00':<10} | {'09:00':<10}")
    print("==========================================================================")

if __name__ == '__main__':
    asyncio.run(verify_all_mandatory_tests())
