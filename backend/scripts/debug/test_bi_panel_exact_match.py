import asyncio
from app.db import init_db
from app.domain.models.user import User
from app.infrastructure.repositories.mongo_bi_repository import MongoBIRepository
from app.application.services.bi_service import BIService

async def verify_bi_panel_exact_match():
    await init_db()
    admin_user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not admin_user:
        print("User admin not found")
        return

    repo = MongoBIRepository()
    bi_service = BIService(repository=repo)

    res = await bi_service.get_panel_general(
        current_user=admin_user,
        start_date="2026-08-28",
        end_date="2026-08-28",
        sucursal_id="all"
    )

    print("=" * 80)
    print("VERIFICACIÓN DE PANEL GENERAL BI (CONECTADO A FINANCIALSERVICE):")
    print(f"  Ingresos Totales (Ventas Netas POS): Bs. {res.ingresos_totales:,.2f}")
    print(f"  Comisión Matriz (15%)              : Bs. {res.comision_matriz_bs:,.2f}")
    print(f"  Margen Retail                      : Bs. {res.margen_retail_bs:,.2f}")
    print(f"  Margen Líquido (Margen Neto Total) : Bs. {res.margen_liquido_bs:,.2f}")
    print(f"  Rentabilidad Contable (%)          : {res.rentabilidad_contable_pct:.2f}%")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(verify_bi_panel_exact_match())
