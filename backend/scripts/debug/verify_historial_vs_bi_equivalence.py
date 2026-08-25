import asyncio
from app.db import get_raw_db, init_db
from app.domain.models.user import User, UserRole
from app.application.services.sales_read_service import SalesReadService
from app.application.services.bi_service import BIService
from app.infrastructure.repositories.mongo_bi_repository import MongoBIRepository

async def run_equivalence_test():
    await init_db()
    db = await get_raw_db()

    # Buscar un usuario SUPERADMIN y uno ADMIN_MATRIZ
    superadmin_user = await User.find_one(User.role == UserRole.SUPERADMIN)
    admin_matriz_user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    test_users = []
    if superadmin_user:
        test_users.append(("SUPERADMIN", superadmin_user))
    if admin_matriz_user:
        test_users.append(("ADMIN_MATRIZ", admin_matriz_user))

    print("=" * 80)
    print("PRUEBA DEFINITIVA DE EQUIVALENCIA: HISTORIAL DE VENTAS VS BI (24/08/2026)")
    print("=" * 80)

    repo = MongoBIRepository()
    bi_service = BIService(repository=repo)

    for role_name, user in test_users:
        print(f"\n--- EVALUANDO PARA ROL: {role_name} (Email: {user.email}, Tenant: '{user.tenant_id}') ---")

        # 1. Extracción directa con SalesReadService (Capa Unificada)
        raw_sales = await SalesReadService.get_raw_sales_for_user(
            user=user,
            start_date_str="2026-08-24",
            end_date_str="2026-08-24"
        )
        sales_count = len(raw_sales)
        sum_total = sum(s.get("total", 0.0) for s in raw_sales)

        # 2. Extracción vía BIService + Pandas ETL Modelo Estrella
        bi_response = await bi_service.get_panel_general(
            current_user=user,
            start_date="2026-08-24",
            end_date="2026-08-24"
        )

        print(f"  [SalesReadService - Historial]: Ventas = {sales_count} | Suma Total = Bs. {sum_total:,.2f}")
        print(f"  [BIService - Panel BI]:         Ventas = {bi_response.cantidad_ordenes} | Suma Total = Bs. {bi_response.ingresos_totales:,.2f}")
        print(f"  [Ticket Medio BI]:              Bs. {bi_response.ticket_medio:,.2f}")

        # Desglose de sucursales en BI
        print("  [Desglose por Sucursal BI]:")
        for suc in bi_response.desglose_sucursales:
            print(f"    - {suc.nombre_sucursal}: Bs. {suc.ingresos:,.2f} ({suc.ordenes} ord, {suc.participacion_pct}%)")

        # Verificación de igualdad matemática
        match_count = sales_count == bi_response.cantidad_ordenes
        match_sum = abs(sum_total - bi_response.ingresos_totales) < 0.01

        if match_count and match_sum:
            print("  ✓ EQUIVALENCIA PERFECTA (Historial == BI)")
        else:
            print("  ❌ DISCREPANCIA DETECTADA")

if __name__ == "__main__":
    asyncio.run(run_equivalence_test())
