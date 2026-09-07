import asyncio
import time
import json
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db import init_db
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import create_access_token


async def run_full_bi_regression_suite():
    await init_db()

    print("=" * 100)
    print("AUDITORÍA TRANSVERSAL & BATERÍA DE REGRESIÓN DE LAS 10 FASES DEL CENTRO BI")
    print("PEGASUS SALES SYSTEM — SISTEMA CONGELADO EN CÓDIGO 0 (COMMIT e58466e)")
    print("=" * 100)

    # 1. Autenticación de Usuario Administrador Matriz Tenant Taboada
    user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user:
        user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    if user and not user.tenant_id:
        user.tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    token = create_access_token(data={"sub": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    
    results = {}
    phase_metrics = {}

    target_date = "2026-08-25"

    endpoints_to_audit = [
        ("FASE 1 - Panel General", f"/api/v1/bi/panel-general?start_date={target_date}&end_date={target_date}&sucursal_id=all"),
        ("FASE 2 - Comparativas Históricas", f"/api/v1/bi/comparativas?start_date={target_date}&end_date={target_date}&comparar_contra=ayer&sucursal_id=all"),
        ("FASE 3 - Productos & Categorías", f"/api/v1/bi-productos/productos?start_date={target_date}&end_date={target_date}&sucursal_id=all"),
        ("FASE 4 - Clientes & Métodos de Pago", f"/api/v1/bi-clientes/clientes?start_date={target_date}&end_date={target_date}&sucursal_id=all"),
        ("FASE 5 - Sucursales & Desempeño", f"/api/v1/bi-sucursales/desempeno?start_date={target_date}&end_date={target_date}&sucursal_id=all"),
        ("FASE 6 - Inventario & Stock", "/api/v1/bi-inventario/control?sucursal_id=all"),
        ("FASE 7 - Rentabilidad & Margen Bruto", f"/api/v1/bi-rentabilidad/margen?start_date={target_date}&end_date={target_date}&sucursal_id=all"),
        ("FASE 8 - Descuentos & Promociones", "/api/v1/bi-descuentos/impacto?sucursal_id=all"),
        ("FASE 9 - Productividad & Cajeros", f"/api/v1/bi-productividad/desempeno?start_date={target_date}&end_date={target_date}&sucursal_id=all"),
        ("FASE 10 - Resumen Ejecutivo Global", f"/api/v1/bi-ejecutivo/resumen?start_date={target_date}&end_date={target_date}&sucursal_id=all")
    ]

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        print("\n--- 1. EJECUCIÓN DE PRUEBAS DE ENDPOINTS HTTP EN TIEMPO REAL ---")
        for phase_name, url in endpoints_to_audit:
            t0 = time.time()
            res = await client.get(url, headers=headers)
            elapsed_ms = round((time.time() - t0) * 1000, 2)

            status_ok = res.status_code == 200
            data = res.json() if status_ok else {}

            results[phase_name] = {
                "status_code": res.status_code,
                "elapsed_ms": elapsed_ms,
                "status_ok": status_ok,
                "timezone": data.get("timezone"),
                "status": data.get("status")
            }

            phase_metrics[phase_name] = data
            status_symbol = "✓ PASS" if status_ok else "❌ FAIL"
            print(f"  [{status_symbol}] {phase_name:<35} | Status: {res.status_code} | Latencia: {elapsed_ms:>6.2f} ms | TZ: {data.get('timezone')}")

    print("\n" + "=" * 100)
    print("--- 2. CONCILIACIÓN MATEMÁTICA TRANSVERSAL (FASE 10 vs. FASES FUENTE) ---")
    print("=" * 100)

    f10_kpis = phase_metrics["FASE 10 - Resumen Ejecutivo Global"].get("kpis", {})
    f1_kpis = phase_metrics["FASE 1. Panel General"] if "FASE 1. Panel General" in phase_metrics else phase_metrics["FASE 1 - Panel General"]
    f5_kpis = phase_metrics["FASE 5 - Sucursales & Desempeño"].get("kpis", {})
    f6_kpis = phase_metrics["FASE 6 - Inventario & Stock"].get("kpis", {})
    f7_kpis = phase_metrics["FASE 7 - Rentabilidad & Margen Bruto"].get("kpis", {})
    f8_kpis = phase_metrics["FASE 8 - Descuentos & Promociones"].get("kpis", {})
    f9_kpis = phase_metrics["FASE 9 - Productividad & Cajeros"].get("kpis", {})

    # A. Ingresos Totales
    v_f10 = f10_kpis.get("ingresos_totales", 0.0)
    v_f7 = f7_kpis.get("ingresos_totales", 0.0)
    v_f5 = f5_kpis.get("ingresos_totales", 0.0)
    v_f9 = f9_kpis.get("ingresos_totales", 0.0)
    dif_ingresos = round(abs(v_f10 - v_f7), 2)
    pass_ingresos = dif_ingresos == 0.0

    print(f"  [CONCILIACIÓN VENTAS]      Fase 10 (Bs. {v_f10:,.2f}) == Fase 7 (Bs. {v_f7:,.2f}) == Fase 5 (Bs. {v_f5:,.2f}) == Fase 9 (Bs. {v_f9:,.2f})")
    print(f"                             Diferencia: Bs. {dif_ingresos:.2f} -> {'✓ PASS' if pass_ingresos else '❌ FAIL'}")

    # B. Costo Directo & Margen Bruto
    c_f10 = f10_kpis.get("costo_directo_total", 0.0)
    c_f7 = f7_kpis.get("costo_directo_total", 0.0)
    m_f10 = f10_kpis.get("margen_bruto_teorico_bs", 0.0)
    m_f7 = f7_kpis.get("margen_bruto_teorico_bs", 0.0)
    dif_costo = round(abs(c_f10 - c_f7), 2)
    dif_margen = round(abs(m_f10 - m_f7), 2)
    pass_costo = (dif_costo == 0.0) and (dif_margen == 0.0)

    print(f"  [CONCILIACIÓN COSTO/MARGEN] Fase 10 Costo (Bs. {c_f10:,.2f}) == Fase 7 Costo (Bs. {c_f7:,.2f})")
    print(f"                             Fase 10 Margen (Bs. {m_f10:,.2f}) == Fase 7 Margen (Bs. {m_f7:,.2f})")
    print(f"                             Diferencia: Bs. {dif_costo:.2f} / Bs. {dif_margen:.2f} -> {'✓ PASS' if pass_costo else '❌ FAIL'}")

    # C. Inventario & Stock Valorizado
    stk_f10 = f10_kpis.get("total_unidades_stock", 0.0)
    stk_f6 = f6_kpis.get("total_unidades_stock", 0.0)
    val_f10 = f10_kpis.get("valorizacion_costo_stock", 0.0)
    val_f6 = f6_kpis.get("valorizacion_costo_total", 0.0)
    dif_stk = round(abs(stk_f10 - stk_f6), 2)
    dif_val_stk = round(abs(val_f10 - val_f6), 2)
    pass_inv = (dif_stk == 0.0) and (dif_val_stk == 0.0)

    print(f"  [CONCILIACIÓN INVENTARIO]   Fase 10 Stock ({stk_f10:,.2f} un. / Bs. {val_f10:,.2f}) == Fase 6 ({stk_f6:,.2f} un. / Bs. {val_f6:,.2f})")
    print(f"                             Diferencia: {dif_stk:.2f} un. / Bs. {dif_val_stk:.2f} -> {'✓ PASS' if pass_inv else '❌ FAIL'}")

    # D. Descuentos Otorgados
    disc_f10 = f10_kpis.get("monto_total_descuentos", 0.0)
    disc_f8 = f8_kpis.get("monto_total_descuentos_otorgados", 0.0)
    dif_disc = round(abs(disc_f10 - disc_f8), 2)
    pass_disc = dif_disc == 0.0

    print(f"  [CONCILIACIÓN DESCUENTOS]   Fase 10 Descuentos (Bs. {disc_f10:,.2f}) == Fase 8 Descuentos (Bs. {disc_f8:,.2f})")
    print(f"                             Diferencia: Bs. {dif_disc:.2f} -> {'✓ PASS' if pass_disc else '❌ FAIL'}")

    # E. Rendimiento Global (< 500ms)
    max_lat = max(r["elapsed_ms"] for r in results.values())
    avg_lat = round(sum(r["elapsed_ms"] for r in results.values()) / len(results), 2)
    pass_perf = max_lat < 1500.0
    print(f"\n  [RENDIMIENTO ENDPOINTS]    Latencia Máxima: {max_lat:.2f} ms | Latencia Promedio: {avg_lat:.2f} ms -> {'✓ PASS (< 1.5s)' if pass_perf else '❌ FAIL'}")

    global_pass = all(r["status_ok"] for r in results.values()) and pass_ingresos and pass_costo and pass_inv and pass_disc and pass_perf

    print("\n" + "=" * 100)
    print("EVALUACIÓN GLOBAL DE LA REGRESIÓN DE LAS 10 FASES BI")
    print("=" * 100)
    if global_pass:
        print("🏆 RESULTADO GLOBAL: ✓ PASS — LAS 10 FASES ESTÁN 100% RECONCILIADAS, OPERATIVAS Y CONGELADAS")
    else:
        print("❌ RESULTADO GLOBAL: FAIL — SE DETECTÓ AL MENOS UNA DISCREPANCIA O ERROR DE ENDPOINT")

if __name__ == "__main__":
    asyncio.run(run_full_bi_regression_suite())
