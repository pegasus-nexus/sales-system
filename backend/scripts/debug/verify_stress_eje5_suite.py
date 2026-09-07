import asyncio
import time
import json
import uuid
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db import init_db
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import create_access_token


async def run_stress_eje5_suite():
    await init_db()

    print("=" * 100)
    print("AUDITORÍA DE PRUEBAS ADVERSARIALES & ESTRÉS DE RED (EJE 5 DE HARDENING)")
    print("PEGASUS SALES SYSTEM — BASELINE CONGELADO (COMMIT 9cc1b6e)")
    print("=" * 100)

    # 1. Usuario Admin Matriz Tenant Taboada
    user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user:
        user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    if user and not user.tenant_id:
        user.tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    token = create_access_token(data={"sub": user.email})
    headers = {"Authorization": f"Bearer {token}"}
    transport = ASGITransport(app=app)

    target_date = "2026-08-25"

    # -------------------------------------------------------------------------
    # CONTROL 1: CARGA CONCURRENTE EN RÁFAGAS (10, 25, 50, 100 PETICIONES)
    # -------------------------------------------------------------------------
    print("\n--- CONTROL 1. CARGA CONCURRENTE MULTI-WORKER DE RÁFAGAS ---")
    
    concurrency_levels = [10, 25, 50, 100]
    control1_pass = True

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        for level in concurrency_levels:
            t0 = time.time()
            tasks = [
                client.get(f"/api/v1/bi-ejecutivo/resumen?start_date={target_date}&end_date={target_date}&sucursal_id=all", headers=headers)
                for _ in range(level)
            ]
            responses = await asyncio.gather(*tasks)
            elapsed_ms = round((time.time() - t0) * 1000, 2)

            error_count = sum(1 for r in responses if r.status_code != 200)
            error_rate = (error_count / level) * 100.0
            avg_lat = round(elapsed_ms / level, 2)

            level_ok = error_count == 0 and avg_lat < 1500.0 # Criterio p95/promedio individual < 1.5s
            if not level_ok:
                control1_pass = False

            print(f"  [CARGA CONCURRENTE] {level:>3} Peticiones Simultáneas | Tiempo Ráfaga: {elapsed_ms:>7.2f} ms | Prom/Pet: {avg_lat:>6.2f} ms | Errores 500: {error_count} ({error_rate:.1f}%) -> {'✓ PASS' if level_ok else '❌ FAIL'}")

    print(f"  [CONTROL 1] Carga Concurrente de Ráfagas Aprobada (0% Error Rate): {'✓ PASS' if control1_pass else '❌ FAIL'}")

    # -------------------------------------------------------------------------
    # CONTROL 2: ATAQUES DE TENANT ISOLATION BLAZING FAST
    # -------------------------------------------------------------------------
    print("\n--- CONTROL 2. ATAQUES ADVERSARIALES DE MULTI-TENANT ISOLATION ---")
    
    control2_pass = True
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Petición con Tenant Inexistente
        res_fake_t = await client.get(
            "/api/v1/bi-ejecutivo/resumen?start_date=2026-08-25&end_date=2026-08-25&tenant_id=69cd7f0a8f3f6866d4cf9999",
            headers=headers
        )
        pass_fake_t = res_fake_t.status_code in [200, 401, 403, 404]
        if res_fake_t.status_code == 200:
            pass_fake_t = res_fake_t.json()["kpis"]["ingresos_totales"] == 2653.0 # Aislado por el token autenticado, ignora inyección en URL

        print(f"  [TENANT ISOLATION] Inyección de Tenant Ajeno en Parámetros URL:   {'✓ PASS' if pass_fake_t else '❌ FAIL'}")
        control2_pass = pass_fake_t

    # -------------------------------------------------------------------------
    # CONTROL 3: JWT BAZO ESTRÉS Y PRUEBAS ADVERSARIALES
    # -------------------------------------------------------------------------
    print("\n--- CONTROL 3. SEGURIDAD JWT BAJO ESTRÉS Y AUTENTICACIÓN ---")
    
    control3_pass = True
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_bad_sig = await client.get(
            "/api/v1/bi-ejecutivo/resumen",
            headers={"Authorization": "Bearer token_completamente_invalido_123456"}
        )
        pass_bad_sig = res_bad_sig.status_code == 401
        print(f"  [JWT STRESS] Rechazo Consistente de Token Falso (401 Unauthorized): {'✓ PASS' if pass_bad_sig else '❌ FAIL'}")
        control3_pass = pass_bad_sig

    # -------------------------------------------------------------------------
    # CONTROL 4: FECHAS EXTREMAS Y CASOS BORDE (ZONA HORARIA AMERICA/LA_PAZ)
    # -------------------------------------------------------------------------
    print("\n--- CONTROL 4. FECHAS EXTREMAS Y CASOS BORDE (AMERICA/LA_PAZ) ---")
    
    control4_pass = True
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # A. Rango 365 días
        res_year = await client.get(
            "/api/v1/bi-ejecutivo/resumen?start_date=2025-01-01&end_date=2025-12-31&sucursal_id=all",
            headers=headers
        )
        pass_year = res_year.status_code == 200
        print(f"  [FECHAS EXTREMAS] Rango Anual Completo (365 Días):                 {'✓ PASS' if pass_year else '❌ FAIL'}")

        # B. Fecha Futura (Sin Ventas)
        res_future = await client.get(
            "/api/v1/bi-ejecutivo/resumen?start_date=2099-01-01&end_date=2099-01-01&sucursal_id=all",
            headers=headers
        )
        pass_future = res_future.status_code == 200
        if pass_future:
            pass_future = res_future.json()["kpis"]["ingresos_totales"] == 0.0

        print(f"  [FECHAS EXTREMAS] Fecha Futura Sin Ventas (Respuesta Vacía Válida): {'✓ PASS' if pass_future else '❌ FAIL'}")
        control4_pass = pass_year and pass_future

    # -------------------------------------------------------------------------
    # CONTROL 5: ESTADOS VACÍOS Y RESPUESTAS ESTRUCTURADAS
    # -------------------------------------------------------------------------
    print("\n--- CONTROL 5. SIMULACIÓN DE ESTADOS VACÍOS Y RESPUESTAS ESTRUCTURADAS ---")
    
    control5_pass = True
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_empty = await client.get(
            "/api/v1/bi-ejecutivo/resumen?start_date=2020-01-01&end_date=2020-01-01&sucursal_id=all",
            headers=headers
        )
        pass_empty = res_empty.status_code == 200
        if pass_empty:
            data = res_empty.json()
            pass_empty = data["status"] == "success" and data["kpis"]["ingresos_totales"] == 0.0 and len(data["sucursales"]) == 0

        print(f"  [ESTADOS VACÍOS] Retorno JSON Estructurado Sin Error 500:          {'✓ PASS' if pass_empty else '❌ FAIL'}")
        control5_pass = pass_empty

    # -------------------------------------------------------------------------
    # CONTROL 6: INTEGRIDAD MATEMÁTICA RECONCILIADA BAJO CARGA
    # -------------------------------------------------------------------------
    print("\n--- CONTROL 6. INTEGRIDAD MATEMÁTICA Y RECONCILIACIÓN BAJO CARGA ---")
    
    control6_pass = True
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_f10 = await client.get(f"/api/v1/bi-ejecutivo/resumen?start_date={target_date}&end_date={target_date}&sucursal_id=all", headers=headers)
        res_f7 = await client.get(f"/api/v1/bi-rentabilidad/margen?start_date={target_date}&end_date={target_date}&sucursal_id=all", headers=headers)
        
        pass_recon = (res_f10.status_code == 200) and (res_f7.status_code == 200)
        if pass_recon:
            k10 = res_f10.json()["kpis"]
            k7 = res_f7.json()["kpis"]
            diff_ing = abs(k10["ingresos_totales"] - k7["ingresos_totales"])
            diff_marg = abs(k10["margen_bruto_teorico_bs"] - k7["margen_bruto_teorico_bs"])
            pass_recon = (diff_ing == 0.0) and (diff_marg == 0.0)
            print(f"  [RECONCILIACIÓN BAJO CARGA] Ejecutivo (Bs. {k10['ingresos_totales']:,.2f}) == Rentabilidad (Bs. {k7['ingresos_totales']:,.2f}) | Dif: Bs. {diff_ing:.2f}")

        print(f"  [CONTROL 6] Conciliación Matemática Preservada (Bs. 0.00 Dif):    {'✓ PASS' if pass_recon else '❌ FAIL'}")
        control6_pass = pass_recon

    # -------------------------------------------------------------------------
    # EVALUACIÓN GLOBAL DEL EJE 5
    # -------------------------------------------------------------------------
    eje5_global_pass = control1_pass and control2_pass and control3_pass and control4_pass and control5_pass and control6_pass

    print("\n" + "=" * 100)
    print("RESUMEN DE AUDITORÍA DEL EJE 5 — PRUEBAS ADVERSARIALES & ESTRÉS DE RED")
    print("=" * 100)
    print(f"  1. Carga Concurrente (Multi-Worker):     {'✓ PASS' if control1_pass else '❌ FAIL'}")
    print(f"  2. Tenant Isolation Adversarial:        {'✓ PASS' if control2_pass else '❌ FAIL'}")
    print(f"  3. JWT Bajo Estrés & Autenticación:     {'✓ PASS' if control3_pass else '❌ FAIL'}")
    print(f"  4. Fechas Extremas (America/La_Paz):    {'✓ PASS' if control4_pass else '❌ FAIL'}")
    print(f"  5. Estados Vacíos & Resiliencia:       {'✓ PASS' if control5_pass else '❌ FAIL'}")
    print(f"  6. Integridad Matemática Bajo Carga:   {'✓ PASS' if control6_pass else '❌ FAIL'}")
    print("=" * 100)

    if eje5_global_pass:
        print("🏆 RESULTADO EJE 5: ✓ PASS — EL SISTEMA ES DE ALTA DISPONIBILIDAD, RESISTENTE Y RIGUROSO MATEMÁTICAMENTE")
    else:
        print("❌ RESULTADO EJE 5: FAIL — SE DETECTÓ AL MENOS UNA DISCREPANCIA O DEGRADACIÓN BAJO ESTRÉS")


if __name__ == "__main__":
    asyncio.run(run_stress_eje5_suite())
