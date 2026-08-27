import asyncio
from app.db import init_db, get_raw_db
from app.domain.models.user import User
from app.application.services.sales_read_service import SalesReadService


async def audit_users_sales_access():
    await init_db()
    users = await User.find_all().to_list()

    print("=" * 100)
    print("AUDITORÍA DE PERMISOS DE USUARIOS Y ACCESO A DATOS BI (CAUSA RAÍZ EN BACKEND POR ROL/TENANT)")
    print("=" * 100)

    for u in users:
        raw_sales = await SalesReadService.get_raw_sales_for_user(
            user=u,
            start_date_str="2026-07-29",
            end_date_str="2026-08-27",
            sucursal_id="all"
        )
        total_ingresos = sum(s.get("total", 0.0) for s in raw_sales)
        print(f"Usuario: {u.email:<30} | Rol: {u.role:<15} | Tenant: {str(u.tenant_id):<25} | Sucursal: {str(u.sucursal_id):<25} | Ventas BI devueltas: Bs. {total_ingresos:,.2f} ({len(raw_sales)} tickets)")

    print("=" * 100)


if __name__ == "__main__":
    asyncio.run(audit_users_sales_access())
