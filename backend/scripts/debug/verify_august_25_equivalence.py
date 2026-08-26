import asyncio
from zoneinfo import ZoneInfo
from app.db import get_raw_db, init_db
from app.domain.models.user import User, UserRole
from app.application.services.sales_read_service import SalesReadService
from app.application.services.bi_service import BIService
from app.infrastructure.repositories.mongo_bi_repository import MongoBIRepository

async def verify_both_days():
    await init_db()
    
    admin_user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not admin_user:
        admin_user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    repo = MongoBIRepository()
    bi_service = BIService(repository=repo)

    dates_to_test = ["2026-08-24", "2026-08-25"]

    print("=" * 80)
    print(f"AUDITORÍA Y EQUIVALENCIA COMPARATIVA HISTORIAL VS BI PARA EL USUARIO '{admin_user.email}'")
    print("=" * 80)

    for test_date in dates_to_test:
        raw_sales = await SalesReadService.get_raw_sales_for_user(
            user=admin_user,
            start_date_str=test_date,
            end_date_str=test_date
        )
        hist_count = len(raw_sales)
        hist_total = sum(s.get("total", 0.0) for s in raw_sales)

        bi_resp = await bi_service.get_panel_general(
            current_user=admin_user,
            start_date=test_date,
            end_date=test_date
        )

        print(f"\n--- FECHA CONSULTADA: {test_date} ---")
        print(f"  [HISTORIAL DE VENTAS]: Ventas = {hist_count} | Total = Bs. {hist_total:,.2f}")
        print(f"  [PANEL GENERAL BI]:    Ventas = {bi_resp.cantidad_ordenes} | Total = Bs. {bi_resp.ingresos_totales:,.2f} | Ticket Medio = Bs. {bi_resp.ticket_medio:,.2f}")
        
        print("  [DESGLOSE SUCURSALES BI]:")
        for suc in bi_resp.desglose_sucursales:
            if suc.ordenes > 0 or suc.ingresos > 0:
                print(f"    - {suc.nombre_sucursal}: Bs. {suc.ingresos:,.2f} ({suc.ordenes} ord, {suc.participacion_pct}%)")

        if hist_count == bi_resp.cantidad_ordenes and abs(hist_total - bi_resp.ingresos_totales) < 0.01:
            print(f"  ✓ EQUIVALENCIA PERFECTA PARA EL DÍA {test_date}")
        else:
            print(f"  ❌ DISCREPANCIA DETECTADA EN EL DÍA {test_date}")

if __name__ == "__main__":
    asyncio.run(verify_both_days())
