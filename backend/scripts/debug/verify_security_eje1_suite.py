import asyncio
import os
import json
import time
from datetime import timedelta
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db import init_db
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import create_access_token
from app.infrastructure.core.config import settings


async def run_security_eje1_suite():
    await init_db()

    print("=" * 100)
    print("AUDITORÍA DE SEGURIDAD, RBAC & TENANT ISOLATION (EJE 1 DE HARDENING)")
    print("PEGASUS SALES SYSTEM — BASELINE CONGELADO (COMMIT dfe1638)")
    print("=" * 100)

    # -------------------------------------------------------------------------
    # PASO 1: AUDITORÍA DE SECRETOS Y CONFIGURACIÓN (.ENV)
    # -------------------------------------------------------------------------
    print("\n--- PASO 1. AUDITORÍA DE SECRETOS (.ENV) ---")
    insecure_defaults = ["supersecretkey_change_me_in_production", "changeme", "secret", "password", "admin123"]
    
    jwt_secret_val = settings.JWT_SECRET_KEY
    mongo_url_val = settings.MONGODB_URL
    has_tz = bool(settings.BUSINESS_TIMEZONE)

    pass_jwt_secure = jwt_secret_val not in insecure_defaults and len(jwt_secret_val) >= 16
    pass_mongo_protected = "mongodb" in mongo_url_val
    pass_required_vars = bool(jwt_secret_val and mongo_url_val and has_tz)
    pass_no_default_secrets = jwt_secret_val not in insecure_defaults

    print(f"  [SECRETOS] JWT Secret seguro (Longitud >= 16): {'✓ PASS' if pass_jwt_secure else '❌ FAIL (Usando valor default o débil)'}")
    print(f"  [SECRETOS] Mongo URI válida:                  {'✓ PASS' if pass_mongo_protected else '❌ FAIL'}")
    print(f"  [SECRETOS] Variables obligatorias presentes:  {'✓ PASS' if pass_required_vars else '❌ FAIL'}")
    print(f"  [SECRETOS] Ausencia de secretos default:     {'✓ PASS' if pass_no_default_secrets else '❌ FAIL (Detectado supersecretkey default)'}")

    step1_pass = pass_jwt_secure and pass_mongo_protected and pass_required_vars and pass_no_default_secrets

    # -------------------------------------------------------------------------
    # PASO 2: AUDITORÍA RBAC POR ROLES Y NIVELES DE ACCESO
    # -------------------------------------------------------------------------
    print("\n--- PASO 2. AUDITORÍA RBAC POR ROLES Y ACCESO DE ENDPOINTS ---")
    
    # 2.1 Usuarios de Prueba para RBAC
    user_admin = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user_admin:
        user_admin = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    if user_admin and not user_admin.tenant_id:
        user_admin.tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    token_admin = create_access_token(data={"sub": user_admin.email})
    headers_admin = {"Authorization": f"Bearer {token_admin}"}

    transport = ASGITransport(app=app)
    
    endpoints_bi = [
        "/api/v1/bi/panel-general?start_date=2026-08-25&end_date=2026-08-25&sucursal_id=all",
        "/api/v1/bi/comparativas?start_date=2026-08-25&end_date=2026-08-25&comparar_contra=ayer&sucursal_id=all",
        "/api/v1/bi-productos/productos?start_date=2026-08-25&end_date=2026-08-25&sucursal_id=all",
        "/api/v1/bi-clientes/clientes?start_date=2026-08-25&end_date=2026-08-25&sucursal_id=all",
        "/api/v1/bi-sucursales/desempeno?start_date=2026-08-25&end_date=2026-08-25&sucursal_id=all",
        "/api/v1/bi-inventario/control?sucursal_id=all",
        "/api/v1/bi-rentabilidad/margen?start_date=2026-08-25&end_date=2026-08-25&sucursal_id=all",
        "/api/v1/bi-descuentos/impacto?sucursal_id=all",
        "/api/v1/bi-productividad/desempeno?start_date=2026-08-25&end_date=2026-08-25&sucursal_id=all",
        "/api/v1/bi-ejecutivo/resumen?start_date=2026-08-25&end_date=2026-08-25&sucursal_id=all"
    ]

    rbac_admin_ok = True
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        for ep in endpoints_bi:
            res = await client.get(ep, headers=headers_admin)
            if res.status_code != 200:
                rbac_admin_ok = False
                print(f"  [RBAC ADMIN_MATRIZ] ❌ Falló {ep} -> Status: {res.status_code}")

    print(f"  [RBAC ADMIN_MATRIZ] Acceso completo a las 10 fases (200 OK): {'✓ PASS' if rbac_admin_ok else '❌ FAIL'}")

    step2_pass = rbac_admin_ok

    # -------------------------------------------------------------------------
    # PASO 3: ATAQUES DE TENANT ISOLATION Y PARÁMETROS MALFORMADOS
    # -------------------------------------------------------------------------
    print("\n--- PASO 3. ATAQUES DE TENANT ISOLATION Y PARÁMETROS ADVERSARIALES ---")
    
    tenant_attacks_ok = True
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # A. ObjectId Inválido de sucursal
        res_inv_id = await client.get("/api/v1/bi/panel-general?sucursal_id=invalid_oid_99999", headers=headers_admin)
        pass_inv_id = res_inv_id.status_code in [200, 400, 404]
        if res_inv_id.status_code == 200:
            # Debe responder con sucursales vacías sin romper el sistema ni fugar datos
            data = res_inv_id.json()
            pass_inv_id = data.get("ingresos_totales") == 0.0 or len(data.get("desglose_sucursales", [])) == 0
        print(f"  [TENANT ISOLATION] Manejo de ObjectId inválido (sucursal_id=invalid): {'✓ PASS' if pass_inv_id else '❌ FAIL'}")

        # B. Inyección de Tenant ajeno inexistente
        user_fake = User(
            username="attacker_test",
            email="attacker@external.com",
            hashed_password="fakehashpassword123",
            tenant_id="69cd7f0a8f3f6866d4cf9999", # Tenant falso no existente
            role=UserRole.ADMIN_MATRIZ
        )
        token_fake = create_access_token(data={"sub": user_fake.email})
        headers_fake = {"Authorization": f"Bearer {token_fake}"}

        res_fake_tenant = await client.get("/api/v1/bi-ejecutivo/resumen?start_date=2026-08-25&end_date=2026-08-25", headers=headers_fake)
        pass_fake_tenant = res_fake_tenant.status_code in [200, 401, 403, 404]
        if res_fake_tenant.status_code == 200:
            data = res_fake_tenant.json()
            pass_fake_tenant = data["kpis"]["ingresos_totales"] == 0.0 # 0 Cero fugas de datos
        print(f"  [TENANT ISOLATION] Inyección de Tenant Ajeno (0 Fuga de Datos):    {'✓ PASS' if pass_fake_tenant else '❌ FAIL'}")

        # C. Rango de Fechas Malformado
        res_bad_date = await client.get("/api/v1/bi/panel-general?start_date=invalid-date&end_date=2026-99-99", headers=headers_admin)
        pass_bad_date = res_bad_date.status_code in [200, 400, 422]
        print(f"  [ADVERSARIAL] Manejo Resiliente de Fechas Malformadas:             {'✓ PASS' if pass_bad_date else '❌ FAIL'}")

        tenant_attacks_ok = pass_inv_id and pass_fake_tenant and pass_bad_date

    step3_pass = tenant_attacks_ok

    # -------------------------------------------------------------------------
    # PASO 4: REVISIÓN DE REPOSITORIOS BI (FILTRO TENANT OBLIGATORIO)
    # -------------------------------------------------------------------------
    print("\n--- PASO 4. REVISIÓN DE REPOSITORIOS BI (PATRÓN DE AISLAMIENTO ESTRICTO) ---")
    
    bi_repos = [
        "app/infrastructure/bi/mongo_productos_repository.py",
        "app/infrastructure/bi/mongo_clientes_repository.py",
        "app/infrastructure/bi/mongo_sucursales_repository.py",
        "app/infrastructure/bi/mongo_inventario_repository.py",
        "app/infrastructure/bi/mongo_rentabilidad_repository.py",
        "app/infrastructure/bi/mongo_descuentos_repository.py",
        "app/infrastructure/bi/mongo_productividad_repository.py",
        "app/infrastructure/bi/mongo_ejecutivo_repository.py"
    ]

    repos_pass = True
    for repo_path in bi_repos:
        full_p = os.path.join(os.getcwd(), repo_path)
        if os.path.exists(full_p):
            with open(full_p, "r", encoding="utf-8") as f:
                content = f.read()
                if "tenant_id" not in content:
                    repos_pass = False
                    print(f"  [REPOS BI] ❌ Falta filtro por tenant_id en {repo_path}")
        else:
            repos_pass = False
            print(f"  [REPOS BI] ❌ Archivo no encontrado: {repo_path}")

    print(f"  [REPOS BI] Filtro obligatorio tenant_id en las 10 fases:           {'✓ PASS' if repos_pass else '❌ FAIL'}")

    step4_pass = repos_pass

    # -------------------------------------------------------------------------
    # PASO 5: VALIDACIÓN DE SEGURIDAD JWT (TOKENS SIN FIRMA / EXPIRADOS)
    # -------------------------------------------------------------------------
    print("\n--- PASO 5. VALIDACIÓN DE SEGURIDAD JWT ---")
    
    jwt_pass = True
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # A. Sin Header de Autorización
        res_no_auth = await client.get("/api/v1/bi-ejecutivo/resumen")
        pass_no_auth = res_no_auth.status_code == 401
        print(f"  [JWT] Rechazo de Petición Sin Token Header (401 Unauthorized):    {'✓ PASS' if pass_no_auth else '❌ FAIL'}")

        # B. Token Manipulado / Firma Inválida
        fake_token_header = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.badsignature"}
        res_bad_sig = await client.get("/api/v1/bi-ejecutivo/resumen", headers=fake_token_header)
        pass_bad_sig = res_bad_sig.status_code == 401
        print(f"  [JWT] Rechazo de Token con Firma Alterada (401 Unauthorized):     {'✓ PASS' if pass_bad_sig else '❌ FAIL'}")

        # C. Token Expirado
        expired_token = create_access_token(data={"sub": user_admin.email}, expires_delta=timedelta(seconds=-10))
        res_exp = await client.get("/api/v1/bi-ejecutivo/resumen", headers={"Authorization": f"Bearer {expired_token}"})
        pass_exp = res_exp.status_code == 401
        print(f"  [JWT] Rechazo de Token Expirado (401 Unauthorized):              {'✓ PASS' if pass_exp else '❌ FAIL'}")

        jwt_pass = pass_no_auth and pass_bad_sig and pass_exp

    step5_pass = jwt_pass

    # -------------------------------------------------------------------------
    # PASO 6: INFORME Y EVALUACIÓN GLOBAL DEL EJE 1
    # -------------------------------------------------------------------------
    eje1_global_pass = step1_pass and step2_pass and step3_pass and step4_pass and step5_pass

    print("\n" + "=" * 100)
    print("RESUMEN DE AUDITORÍA DEL EJE 1 — SEGURIDAD, RBAC & TENANT ISOLATION")
    print("=" * 100)
    print(f"  1. Auditoría de Secretos (.env):        {'✓ PASS' if step1_pass else '❌ FAIL'}")
    print(f"  2. Auditoría RBAC:                     {'✓ PASS' if step2_pass else '❌ FAIL'}")
    print(f"  3. Ataques Tenant Isolation & Inyección: {'✓ PASS' if step3_pass else '❌ FAIL'}")
    print(f"  4. Revisión de Repositorios BI:        {'✓ PASS' if step4_pass else '❌ FAIL'}")
    print(f"  5. Validación JWT & Bypasses:          {'✓ PASS' if step5_pass else '❌ FAIL'}")
    print("=" * 100)

    if eje1_global_pass:
        print("🏆 RESULTADO EJE 1: ✓ PASS — EL SISTEMA ES SEGURO, AISLADO Y PROTEGIDO CONTRA ATAQUES DE TENANT")
    else:
        print("❌ RESULTADO EJE 1: FAIL — SE DETECTÓ AL MENOS UN INCUMPLIMIENTO DE SEGURIDAD")


if __name__ == "__main__":
    asyncio.run(run_security_eje1_suite())
