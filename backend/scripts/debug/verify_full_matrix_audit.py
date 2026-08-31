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


async def run_full_matrix_audit():
    await init_db()
    db = await get_raw_db()

    print("=" * 110)
    print("AUDITORÍA DE PRECISIÓN EMPÍRICA MULTI-TENANT / ROL / CAPAS BI — PEGASUS SALES SYSTEM")
    print("=" * 110)

    # 1. INSPECCIÓN DE CAMPO DE FECHA UTILIZADO EN MONGODB
    sample_sale = await db.sales.find_one({"anulada": {"$ne": True}})
    print("\n[ESTRUCTURA DE FECHA EN MONGODB 'sales']:")
    if sample_sale:
        print(f"  - Campo fecha principal : 'created_at'")
        print(f"  - Tipo de dato          : {type(sample_sale.get('created_at'))}")
        print(f"  - Valor muestra         : {sample_sale.get('created_at')}")
        print(f"  - Campo total           : {sample_sale.get('total')} ({type(sample_sale.get('total'))})")
        print(f"  - Campo anulada         : {sample_sale.get('anulada')}")
        print(f"  - Campo tenant_id       : {sample_sale.get('tenant_id')} ({type(sample_sale.get('tenant_id'))})")
        print(f"  - Campo sucursal_id     : {sample_sale.get('sucursal_id')} ({type(sample_sale.get('sucursal_id'))})")

    # 2. AUDITORÍA PARA RANGO HOY (2026-08-27) Y 30 DÍAS (2026-07-29 a 2026-08-27)
    test_ranges = [
        ("Hoy (2026-08-27)", "2026-08-27", "2026-08-27"),
        ("Ayer (2026-08-26)", "2026-08-26", "2026-08-26"),
        ("7 Días (2026-08-21 -> 2026-08-27)", "2026-08-21", "2026-08-27"),
        ("30 Días (2026-07-29 -> 2026-08-27)", "2026-07-29", "2026-08-27"),
    ]

    bi_repo = MongoBIRepository()
    bi_service = BIService(repository=bi_repo)

    users = await User.find_all().to_list()

    for label, s_str, e_str in test_ranges:
        print("\n" + "-" * 110)
        print(f"RANGO AUDITADO: {label}")
        print("-" * 110)

        # A) MONGODB DIRECTO GLOBAL
        start_utc, end_utc = SalesReadService.calculate_bolivia_date_range(s_str, e_str)
        q_mongo_global = {
            "anulada": {"$ne": True},
            "created_at": {"$gte": start_utc, "$lt": end_utc}
        }
        docs_mongo = await db.sales.find(q_mongo_global).to_list(length=None)
        monto_mongo_global = sum(safe_float(d.get("total", 0.0)) for d in docs_mongo)
        print(f"  [MongoDB Global Sin Filtro Tenant/Rol] -> Ventas: Bs. {monto_mongo_global:,.2f} | Tickets: {len(docs_mongo)}")

        # B) RESULTADO SERVIDOR POR USUARIO AUTÉNTICO DE CADA ROL EN SESIÓN REAL
        print("  [Simulación de Respuesta FastAPI por Perfil de UsuarioAutenticado]:")
        for u in users:
            # Solo mostrar usuarios representativos
            if u.email in ["admin.general.taboada@taboada.bo", "nicole.romina@taboada.bo", "jenifer.aguayo@taboada.bo", "system.montalvo.catering@gmail.com", "admin@taboada.com"]:
                res_panel = await bi_service.get_panel_general(
                    current_user=u,
                    start_date=s_str,
                    end_date=e_str,
                    sucursal_id="all"
                )
                print(f"    • Usuario: {u.email:<35} | Rol: {u.role.value:<15} | Sucursal: {str(u.sucursal_id):<25}")
                print(f"      -> API Response: fecha_inicio='{res_panel.fecha_inicio_bolivia}' | ingresos_totales=Bs. {res_panel.ingresos_totales:,.2f} | ordenes={res_panel.cantidad_ordenes}")

    print("\n" + "=" * 110)


if __name__ == "__main__":
    asyncio.run(run_full_matrix_audit())
