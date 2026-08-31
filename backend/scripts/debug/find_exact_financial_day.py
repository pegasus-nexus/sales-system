import asyncio
from app.db import init_db, get_raw_db
from app.domain.models.user import User
from app.api.v1.endpoints.reports import get_financial_report
from datetime import datetime, timedelta

async def find_matching_financial_data():
    await init_db()
    admin_user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not admin_user:
        print("User not found")
        return

    # Buscar fechas en agosto 2026
    for i in range(1, 30):
        d_str = f"2026-08-{i:02d}"
        res = await get_financial_report(
            start_date=d_str,
            end_date=d_str,
            sucursal_id="all",
            category=None,
            proveedor=None,
            current_user=admin_user
        )
        if res:
            tot_pub = sum(r.get("total_publico", 0) for r in res)
            tot_fab = sum(r.get("total_fabrica", 0) for r in res)
            m_dist = sum(r.get("margen_distribuidor", 0) for r in res)
            m_ret = sum(r.get("margen_retail", 0) for r in res)
            m_tot = sum(r.get("margen_total", 0) for r in res)

            print(f"Fecha: {d_str} | Ventas: Bs. {tot_pub:,.2f} | Matriz: Bs. {m_dist:,.2f} | Retail: Bs. {m_ret:,.2f} | Margen Total: Bs. {m_tot:,.2f}")

if __name__ == "__main__":
    asyncio.run(find_matching_financial_data())
