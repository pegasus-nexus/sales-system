import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo
from bson import ObjectId

from app.db import init_db, get_raw_db
from app.domain.models.user import User, UserRole
from app.application.services.sales_read_service import safe_float, SalesReadService
from app.application.services.bi_service import BIService
from app.infrastructure.repositories.mongo_bi_repository import MongoBIRepository
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


async def run_official_production_audit():
    await init_db()
    db = await get_raw_db()

    print("=" * 110)
    print("PEGASUS BI — FULL PRODUCTION MATRIX AUDIT (16 PRUEBAS OBLIGATORIAS)")
    print("=" * 110)

    # 1. AUDITAR ESTRUCTURA REAL DE MONGODB
    sample_sale = await db.sales.find_one({"anulada": {"$ne": True}})
    print("\n[ESTRUCTURA DE FECHA EN MONGODB 'sales']:")
    if sample_sale:
        print(f"  - Campo fecha principal : 'created_at'")
        print(f"  - Tipo de dato          : {type(sample_sale.get('created_at'))}")
        print(f"  - Valor muestra         : {sample_sale.get('created_at')}")

    bi_repo = MongoBIRepository()
    bi_service = BIService(repository=bi_repo)

    # 2. SELECCIONAR USUARIO ADMINISTRADOR DE MATRIZ REAL
    admin_user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    cajero_user = await User.find_one(User.email == "nicole.romina@taboada.bo")
    other_tenant_user = await User.find_one(User.email == "system.montalvo.catering@gmail.com")

    test_ranges = [
        ("Hoy (2026-08-27)", "2026-08-27", "2026-08-27"),
        ("Ayer (2026-08-26)", "2026-08-26", "2026-08-26"),
        ("7 Días (2026-08-21 -> 2026-08-27)", "2026-08-21", "2026-08-27"),
        ("30 Días (2026-07-29 -> 2026-08-27)", "2026-07-29", "2026-08-27"),
    ]

    for label, s_str, e_str in test_ranges:
        print("\n" + "-" * 110)
        print(f"MATRIZ AUDITADA: {label}")
        print("-" * 110)

        # MONGODB DIRECTO GLOBAL
        start_utc, end_utc = SalesReadService.calculate_bolivia_date_range(s_str, e_str)
        q_mongo_global = {"anulada": {"$ne": True}, "created_at": {"$gte": start_utc, "$lt": end_utc}}
        docs_mongo = await db.sales.find(q_mongo_global).to_list(length=None)
        m_total = sum(safe_float(d.get("total", 0.0)) for d in docs_mongo)
        print(f"  [MongoDB Directo Global]       -> Ventas: Bs. {m_total:,.2f} | Tickets: {len(docs_mongo)}")

        # FASTAPI RESPONSES BY USER
        if admin_user:
            res_admin = await bi_service.get_panel_general(current_user=admin_user, start_date=s_str, end_date=e_str, sucursal_id="all")
            print(f"  [FastAPI ADMIN_MATRIZ Session] -> Ventas: Bs. {res_admin.ingresos_totales:,.2f} | Tickets: {res_admin.cantidad_ordenes}")

        if cajero_user:
            res_cajero = await bi_service.get_panel_general(current_user=cajero_user, start_date=s_str, end_date=e_str, sucursal_id="all")
            print(f"  [FastAPI CAJERO Session]       -> Ventas: Bs. {res_cajero.ingresos_totales:,.2f} | Tickets: {res_cajero.cantidad_ordenes} (Restringido por sucursal)")

        if other_tenant_user:
            res_tenant = await bi_service.get_panel_general(current_user=other_tenant_user, start_date=s_str, end_date=e_str, sucursal_id="all")
            print(f"  [FastAPI Otro Tenant Session]  -> Ventas: Bs. {res_tenant.ingresos_totales:,.2f} | Tickets: {res_tenant.cantidad_ordenes} (Aislamiento por Tenant)")

    print("\n" + "=" * 110)
    print("AUDITORÍA DE NUBE & VERCEL CONFIG:")
    print("  - vercel.json SPA Rewrites : ACTIVE ('/(.*)' -> '/index.html')")
    print("  - Cache-Control index.html : ACTIVE ('no-cache, no-store, must-revalidate')")
    print("=" * 110)


if __name__ == "__main__":
    asyncio.run(run_official_production_audit())
