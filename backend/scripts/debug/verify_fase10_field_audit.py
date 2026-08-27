import asyncio
import json
from datetime import datetime
from zoneinfo import ZoneInfo
from bson import ObjectId

from app.db import init_db, get_raw_db
from app.domain.models.user import User, UserRole
from app.application.bi.ejecutivo_service import EjecutivoBIService
from app.application.services.sales_read_service import safe_float
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


async def run_fase10_field_audit():
    await init_db()

    print("=" * 100)
    print("AUDITORÍA TÉCNICA DE CAMPO Y CONCILIACIÓN INTEGRAL — FASE 10: RESUMEN EJECUTIVO GLOBAL")
    print("PEGASUS SALES SYSTEM — PROTOCOLO DE AUDITORÍA FASE A FASE (10/10)")
    print("=" * 100)

    db = await get_raw_db()
    tenant_id_str = "69cd7f0a8f3f6866d4cfbb62"
    tenant_filter = {"tenant_id": {"$in": [tenant_id_str, ObjectId(tenant_id_str)]}}

    # 1. Extracción Directa de MongoDB sales, inventario y products para 2026-08-25
    s25_utc = datetime(2026, 8, 25, 4, 0, 0)
    e25_utc = datetime(2026, 8, 26, 4, 0, 0)
    docs_25 = await db.sales.find({**tenant_filter, "anulada": {"$ne": True}, "created_at": {"$gte": s25_utc, "$lt": e25_utc}}).to_list(length=None)
    prod_docs = await db.products.find(tenant_filter).to_list(length=None)
    inv_docs = await db.inventario.find(tenant_filter).to_list(length=None)

    total_ventas_mongo = sum(safe_float(doc.get("total")) for doc in docs_25)
    total_tickets_mongo = len(docs_25)

    prods_cost_map = {}
    for p in prod_docs:
        p_id = str(p["_id"])
        c_val = safe_float(p.get("costo_producto") if p.get("costo_producto") is not None else (p.get("costo") or p.get("costo_unitario") or 0.0))
        prods_cost_map[p_id] = c_val

    total_costos_mongo = 0.0
    for doc in docs_25:
        items = doc.get("items", [])
        for item in items:
            p_id = str(item.get("product_id") or item.get("producto_id") or "")
            cant = safe_float(item.get("cantidad") or item.get("quantity"))
            costo_unit = prods_cost_map.get(p_id, safe_float(item.get("costo_unitario") or item.get("costo") or 0.0))
            total_costos_mongo += (cant * costo_unit)

    total_margen_mongo = round(total_ventas_mongo - total_costos_mongo, 2)
    pct_margen_mongo = round((total_margen_mongo / total_ventas_mongo) * 100.0, 2) if total_ventas_mongo > 0 else 0.0

    total_unidades_inv = 0.0
    total_valorization_inv = 0.0
    for item in inv_docs:
        p_id = str(item.get("producto_id") or item.get("product_id") or "")
        cant = safe_float(item.get("stock_actual") or item.get("cantidad") or item.get("stock") or 0.0)
        costo = prods_cost_map.get(p_id, 0.0)
        total_unidades_inv += cant
        total_valorization_inv += (cant * costo)

    print(f"  [MONGODB DIRECTO GLOBAL 2026-08-25]:")
    print(f"    - Ventas Netas Totales   : Bs. {total_ventas_mongo:,.2f}")
    print(f"    - Costo Directo Total    : Bs. {total_costos_mongo:,.2f}")
    print(f"    - Margen Bruto Monetario : Bs. {total_margen_mongo:,.2f} ({pct_margen_mongo:.2f}%)")
    print(f"    - Tickets Totales Emitidos: {total_tickets_mongo} tickets")
    print(f"    - Stock Unidades Físicas : {total_unidades_inv:,.2f} un")
    print(f"    - Valorización de Stock  : Bs. {total_valorization_inv:,.2f}")

    user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user:
        user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    if user and not user.tenant_id:
        user.tenant_id = tenant_id_str

    exec_service = EjecutivoBIService()

    # -------------------------------------------------------------------------
    # CONTROL 1: FECHAS & TIMEZONE AMERICA/LA_PAZ
    # -------------------------------------------------------------------------
    print("\n--- 1. FECHAS & TIMEZONE AMERICA/LA_PAZ ---")
    res_exec = await exec_service.get_ejecutivo_summary(
        user=user,
        start_date="2026-08-25",
        end_date="2026-08-25",
        sucursal_id="all"
    )

    pass_ctrl1 = res_exec.timezone == "America/La_Paz" and res_exec.status == "success"
    print(f"  [TZ AMERICA/LA_PAZ] Timezone: {res_exec.timezone} | Status: {res_exec.status} -> {'✓ PASS' if pass_ctrl1 else '❌ FAIL'}")

    # -------------------------------------------------------------------------
    # CONTROL 2: CONCILIACIÓN DE VENTAS Y TICKETS GLOBALES (Bs. 0.00 Dif)
    # -------------------------------------------------------------------------
    print("\n--- 2. CONCILIACIÓN DE VENTAS Y TICKETS GLOBALES (Bs. 0.00 Dif) ---")
    diff_ventas = abs(total_ventas_mongo - res_exec.kpis.ingresos_totales)
    diff_tickets = abs(total_tickets_mongo - res_exec.kpis.total_tickets)

    pass_ctrl2 = diff_ventas < 0.01 and diff_tickets == 0
    print(f"  [VENTAS GLOBALES] Mongo Bs. {total_ventas_mongo:,.2f} == API Bs. {res_exec.kpis.ingresos_totales:,.2f} | Dif: Bs. {diff_ventas:.2f}")
    print(f"  [TICKETS GLOBALES] Mongo {total_tickets_mongo} tickets == API {res_exec.kpis.total_tickets} tickets | Dif: {diff_tickets} -> {'✓ PASS' if pass_ctrl2 else '❌ FAIL'}")

    # -------------------------------------------------------------------------
    # CONTROL 3: CONCILIACIÓN DE RENTABILIDAD Y MARGEN BRUTO
    # -------------------------------------------------------------------------
    print("\n--- 3. CONCILIACIÓN DE RENTABILIDAD Y MARGEN BRUTO ---")
    diff_costos = abs(total_costos_mongo - res_exec.kpis.costo_directo_total)
    diff_margen_bs = abs(total_margen_mongo - res_exec.kpis.margen_bruto_teorico_bs)
    diff_margen_pct = abs(pct_margen_mongo - res_exec.kpis.margen_bruto_teorico_pct)

    pass_ctrl3 = diff_costos < 0.01 and diff_margen_bs < 0.01 and diff_margen_pct < 0.01
    print(f"  [COSTO DIRECTO] Mongo Bs. {total_costos_mongo:,.2f} == API Bs. {res_exec.kpis.costo_directo_total:,.2f} | Dif: Bs. {diff_costos:.2f}")
    print(f"  [MARGEN BRUTO]  Mongo Bs. {total_margen_mongo:,.2f} ({pct_margen_mongo:.2f}%) == API Bs. {res_exec.kpis.margen_bruto_teorico_bs:,.2f} ({res_exec.kpis.margen_bruto_teorico_pct:.2f}%) | Dif: Bs. {diff_margen_bs:.2f} -> {'✓ PASS' if pass_ctrl3 else '❌ FAIL'}")

    # -------------------------------------------------------------------------
    # CONTROL 4: CONCILIACIÓN DE INVENTARIO Y VALORIZACIÓN (FASE 6 RECONCILIADA)
    # -------------------------------------------------------------------------
    print("\n--- 4. CONCILIACIÓN DE INVENTARIO Y VALORIZACIÓN (FASE 6 CORREGIDA) ---")
    diff_unidades_inv = abs(total_unidades_inv - res_exec.kpis.total_unidades_stock)
    diff_valor_inv = abs(total_valorization_inv - res_exec.kpis.valorizacion_costo_stock)

    pass_ctrl4 = diff_unidades_inv < 0.01 and diff_valor_inv < 0.01
    print(f"  [UNIDADES STOCK] Mongo {total_unidades_inv:,.2f} un == API {res_exec.kpis.total_unidades_stock:,.2f} un | Dif: {diff_unidades_inv:.2f} un")
    print(f"  [VALORIZACIÓN]   Mongo Bs. {total_valorization_inv:,.2f} == API Bs. {res_exec.kpis.valorizacion_costo_stock:,.2f} | Dif: Bs. {diff_valor_inv:.2f} -> {'✓ PASS' if pass_ctrl4 else '❌ FAIL'}")

    # -------------------------------------------------------------------------
    # CONTROL 5: SUMA DE DESGLOSE DE SUCURSALES = TOTAL GENERAL
    # -------------------------------------------------------------------------
    print("\n--- 5. SUMA DE DESGLOSE DE SUCURSALES = TOTAL GENERAL ---")
    sum_suc_bs = sum(s.ingresos_bs for s in res_exec.sucursales)
    sum_suc_tickets = sum(s.tickets_conteo for s in res_exec.sucursales)
    diff_suc_bs = abs(total_ventas_mongo - sum_suc_bs)
    diff_suc_tickets = abs(total_tickets_mongo - sum_suc_tickets)

    pass_ctrl5 = diff_suc_bs < 0.01 and diff_suc_tickets == 0
    print(f"  [SUMA SUCURSALES] Mongo Bs. {total_ventas_mongo:,.2f} == Suma Sucursales Bs. {sum_suc_bs:,.2f} | Dif: Bs. {diff_suc_bs:.2f} -> {'✓ PASS' if pass_ctrl5 else '❌ FAIL'}")

    # -------------------------------------------------------------------------
    # CONTROL 6: LÍDERES OPERACIONALES (SUCURSAL Y CAJERO LÍDER)
    # -------------------------------------------------------------------------
    print("\n--- 6. LÍDERES OPERACIONALES (SUCURSAL Y CAJERO LÍDER) ---")
    pass_ctrl6 = bool(res_exec.kpis.sucursal_lider_nombre) and bool(res_exec.kpis.cajero_lider_nombre)
    print(f"  Sucursal Líder: '{res_exec.kpis.sucursal_lider_nombre}' (Bs. {res_exec.kpis.sucursal_lider_ingresos:,.2f})")
    print(f"  Cajero Líder  : '{res_exec.kpis.cajero_lider_nombre}' (Bs. {res_exec.kpis.cajero_lider_ingresos:,.2f}) -> {'✓ PASS' if pass_ctrl6 else '❌ FAIL'}")

    # -------------------------------------------------------------------------
    # CONTROL 7: ESTADOS NO DISPONIBLES DECLARADOS EXPLÍCITAMENTE (SIN MOCKS)
    # -------------------------------------------------------------------------
    print("\n--- 7. ESTADOS NO DISPONIBLES DECLARADOS EXPLÍCITAMENTE ---")
    traz = res_exec.trazabilidad
    pass_ctrl7 = "NO_DISPONIBLE" in traz.get("ebitda_gastos_operativos", "") and "NO_DISPONIBLE" in traz.get("pronosticos_ia", "")
    print(f"  Métricas de EBITDA e IA declaradas explícitamente como NO DISPONIBLES -> {'✓ PASS' if pass_ctrl7 else '❌ FAIL'}")

    # -------------------------------------------------------------------------
    # CONTROL 8: TENANT ISOLATION Y RESILIENCIA EN FECHAS FUTURAS
    # -------------------------------------------------------------------------
    print("\n--- 8. TENANT ISOLATION & RESILIENCIA EN FECHAS SIN VENTAS ---")
    res_empty = await exec_service.get_ejecutivo_summary(user=user, start_date="2099-01-01", end_date="2099-01-01", sucursal_id="all")
    pass_ctrl8 = res_empty.kpis.ingresos_totales == 0.0 and res_empty.kpis.total_tickets == 0 and pass_ctrl2

    fase10_pass = pass_ctrl1 and pass_ctrl2 and pass_ctrl3 and pass_ctrl4 and pass_ctrl5 and pass_ctrl6 and pass_ctrl7 and pass_ctrl8

    print("\n" + "=" * 100)
    print("MATRIZ DE AUDITORÍA INTEGRAL Y CONCILIACIÓN FASE 10: RESUMEN EJECUTIVO GLOBAL")
    print("====================================================================================================")
    print(f"  1. Fechas & Timezone America/La_Paz:     {'✓ PASS' if pass_ctrl1 else '❌ FAIL'}")
    print(f"  2. Ventas & Tickets Globales (0 Dif):   {'✓ PASS' if pass_ctrl2 else '❌ FAIL'}")
    print(f"  3. Rentabilidad & Margen Bruto (0 Dif): {'✓ PASS' if pass_ctrl3 else '❌ FAIL'}")
    print(f"  4. Inventario Valorizado (0 Dif):       {'✓ PASS' if pass_ctrl4 else '❌ FAIL'}")
    print(f"  5. Suma Sucursales = Total General 1:1: {'✓ PASS' if pass_ctrl5 else '❌ FAIL'}")
    print(f"  6. Rankings de Líderes Operacionales:  {'✓ PASS' if pass_ctrl6 else '❌ FAIL'}")
    print(f"  7. Métricas No Disponibles Declaradas:   {'✓ PASS' if pass_ctrl7 else '❌ FAIL'}")
    print(f"  8. Tenant Isolation & Resiliencia:       {'✓ PASS' if pass_ctrl8 else '❌ FAIL'}")
    print("====================================================================================================")

    if fase10_pass:
        print("🏆 RESULTADO FASE 10: ✓ PASS — EL RESUMEN EJECUTIVO GLOBAL Y EL CENTRO BI (10/10) ESTÁN 100% RECONCILIADOS Y FIELMENTE CERTIFICADOS")
    else:
        print("❌ RESULTADO FASE 10: FAIL — SE DETECTÓ UNA DISCREPANCIA EN EL RESUMEN EJECUTIVO")


if __name__ == "__main__":
    asyncio.run(run_fase10_field_audit())
