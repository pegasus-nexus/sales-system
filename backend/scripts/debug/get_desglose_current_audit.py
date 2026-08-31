import asyncio
from zoneinfo import ZoneInfo
from app.db import init_db, get_raw_db
from app.domain.models.user import User
from app.application.services.bi_service import BIService
from app.infrastructure.repositories.mongo_bi_repository import MongoBIRepository

async def main():
    await init_db()
    admin_user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not admin_user:
        print("Admin user not found")
        return

    bi_repo = MongoBIRepository()
    bi_service = BIService(repository=bi_repo)

    ranges = [
        ("Hoy (2026-08-27)", "2026-08-27", "2026-08-27"),
        ("Ayer (2026-08-26)", "2026-08-26", "2026-08-26"),
        ("7 Días (2026-08-21 -> 2026-08-27)", "2026-08-21", "2026-08-27"),
        ("30 Días (2026-07-29 -> 2026-08-27)", "2026-07-29", "2026-08-27"),
    ]

    for label, s, e in ranges:
        res = await bi_service.get_panel_general(current_user=admin_user, start_date=s, end_date=e, sucursal_id="all")
        print("=" * 80)
        print(f"Rango: {label}")
        print(f"Ingresos: Bs. {res.ingresos_totales:,.2f} | Ordenes: {res.cantidad_ordenes} | TM: Bs. {res.ticket_medio:,.2f}")
        print("Desglose por Sucursales:")
        for suc in res.desglose_sucursales:
            if suc.ordenes > 0 or suc.ingresos > 0:
                print(f"  • {suc.nombre_sucursal}: Bs. {suc.ingresos:,.2f} ({suc.ordenes} órdenes, {suc.participacion_pct}%, TM: Bs. {suc.ticket_medio:,.2f})")

if __name__ == "__main__":
    asyncio.run(main())
