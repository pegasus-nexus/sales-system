import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo
from app.db import get_raw_db, init_db
from app.domain.models.user import User, UserRole
from app.domain.models.sale import Sale
from app.utils.date_utils import get_range_bolivia

async def compare_queries():
    await init_db()
    db = await get_raw_db()

    start_dt, end_dt = get_range_bolivia("2026-08-24", "2026-08-24")
    print(f"Rango de Fechas get_range_bolivia('2026-08-24'): {start_dt} a {end_dt}")

    # 1. Consulta sin filtro de tenant (Superadmin bypass en Historial de Ventas)
    all_history_sales = await db.sales.find({
        "created_at": {"$gte": start_dt, "$lte": end_dt},
        "anulada": {"$ne": True}
    }).to_list(None)

    print(f"\n[HISTORIAL DE VENTAS SIN TENANT FILTER - SUPERADMIN]: Total ventas = {len(all_history_sales)}")

    # Desglose por tenant_id en la base de datos
    tenants_found = {}
    for s in all_history_sales:
        t_id = str(s.get("tenant_id"))
        tenants_found[t_id] = tenants_found.get(t_id, 0) + 1

    print("  Desglose por tenant_id en Historial de Ventas del 24/08:")
    for t_id, cnt in tenants_found.items():
        print(f"    tenant_id: '{t_id}' -> {cnt} ventas")

    # 2. Consultar todos los usuarios y lo que ve cada uno en el BI vs Historial
    users = await db.users.find({}).to_list(None)
    print("\n[EVALUACIÓN POR USUARIO CONECTADO]:")
    for u in users:
        email = u.get("email")
        role = u.get("role")
        tenant_id = u.get("tenant_id")

        # Lógica de Historial de Ventas
        filters = [Sale.created_at >= start_dt, Sale.created_at <= end_dt, Sale.anulada == False]
        if role != UserRole.SUPERADMIN:
            t_str = tenant_id or "default"
            # Soporte de Beanie
            sales_user = await db.sales.find({
                "created_at": {"$gte": start_dt, "$lte": end_dt},
                "anulada": {"$ne": True},
                "tenant_id": {"$in": [str(t_str), t_str]}
            }).to_list(None)
        else:
            sales_user = all_history_sales

        print(f"  Usuario: {email} | Rol: {role} | Tenant ID: '{tenant_id}' -> Ve {len(sales_user)} ventas el 24/08")

if __name__ == "__main__":
    asyncio.run(compare_queries())
