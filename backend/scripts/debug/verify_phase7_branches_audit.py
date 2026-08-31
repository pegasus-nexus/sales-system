import asyncio
from zoneinfo import ZoneInfo
from bson import ObjectId

from app.db import init_db, get_raw_db
from app.domain.models.user import User
from app.application.services.sales_read_service import safe_float, SalesReadService
from app.application.services.bi_service import BIService
from app.infrastructure.repositories.mongo_bi_repository import MongoBIRepository
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


async def run_phase7_branch_audit():
    await init_db()
    db = await get_raw_db()
    bi_repo = MongoBIRepository()
    bi_service = BIService(repository=bi_repo)

    admin_user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    cajero_user = await User.find_one(User.email == "nicole.romina@taboada.bo")

    print("=" * 110)
    print("FASE 7 — MATRIZ DE AUDITORÍA DE PRUEBAS A, B, C, D POR CAPA Y USUARIOS")
    print("=" * 110)

    test_cases = [
        ("PRUEBA A: Hoy (2026-08-27 / sucursal_id='all')", "2026-08-27", "2026-08-27", "all"),
        ("PRUEBA B: Ayer (2026-08-26 / sucursal_id='all')", "2026-08-26", "2026-08-26", "all"),
        ("PRUEBA C: 30 Días (2026-07-29 -> 2026-08-27 / sucursal_id='all')", "2026-07-29", "2026-08-27", "all"),
    ]

    for label, s_str, e_str, suc_id in test_cases:
        print(f"\n{label}:")
        start_utc, end_utc = SalesReadService.calculate_bolivia_date_range(s_str, e_str)
        q_mongo = {"anulada": {"$ne": True}, "created_at": {"$gte": start_utc, "$lt": end_utc}}
        mongo_docs = await db.sales.find(q_mongo).to_list(length=None)
        mongo_monto = sum(safe_float(d.get("total", 0.0)) for d in mongo_docs)

        print(f"  - Capa 1 [MongoDB Directo Global]       : Bs. {mongo_monto:,.2f} | {len(mongo_docs)} ordenes")

        if admin_user:
            res_admin = await bi_service.get_panel_general(current_user=admin_user, start_date=s_str, end_date=e_str, sucursal_id=suc_id)
            print(f"  - Capa 2 [FastAPI ADMIN_MATRIZ Session] : Bs. {res_admin.ingresos_totales:,.2f} | {res_admin.cantidad_ordenes} ordenes")

        if cajero_user:
            res_cajero = await bi_service.get_panel_general(current_user=cajero_user, start_date=s_str, end_date=e_str, sucursal_id=suc_id)
            print(f"  - Capa 3 [FastAPI CAJERO Heroinas]      : Bs. {res_cajero.ingresos_totales:,.2f} | {res_cajero.cantidad_ordenes} ordenes (Aislamiento por sucursal)")

    # PRUEBA D: CADENA INDIVIDUAL DE SUCURSALES PARA HOY (2026-08-27)
    print("\n" + "-" * 110)
    print("PRUEBA D: DESGLOSE INDIVIDUAL DE SUCURSALES PARA HOY (2026-08-27)")
    print("-" * 110)
    tenant_cond = {"tenant_id": str(admin_user.tenant_id)} if admin_user else {}
    sucursales = await db.sucursales.find(tenant_cond).to_list(length=None)

    suma_individual_sucursales = 0.0
    total_ordenes_individuales = 0

    for suc in sucursales:
        s_id_str = str(suc["_id"])
        res_suc = await bi_service.get_panel_general(current_user=admin_user, start_date="2026-08-27", end_date="2026-08-27", sucursal_id=s_id_str)
        suma_individual_sucursales += res_suc.ingresos_totales
        total_ordenes_individuales += res_suc.cantidad_ordenes
        print(f"  - Sucursal '{suc.get('nombre')}' (ID: {s_id_str}): Bs. {res_suc.ingresos_totales:,.2f} | {res_suc.cantidad_ordenes} ordenes")

    print("-" * 110)
    print(f"  SUMA TOTAL DE SUCURSALES INDIVIDUALES : Bs. {suma_individual_sucursales:,.2f} | {total_ordenes_individuales} ordenes")
    print("=" * 110)


if __name__ == "__main__":
    asyncio.run(run_phase7_branch_audit())
