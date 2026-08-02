# -*- coding: utf-8 -*-
"""
Verificación de get_dashboard_metrics_v2 para hoy y ayer.
"""
import asyncio
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

async def main():
    from app.db import init_db
    from app.services.analytics_v2_service import get_dashboard_metrics_v2

    await init_db()

    # 1. Rango Ayer (2026-07-31)
    start_yesterday = datetime(2026, 7, 31, 4, 0, 0)
    end_yesterday   = datetime(2026, 8, 1, 3, 59, 59, 999999)

    res_y = await get_dashboard_metrics_v2(
        tenant_id=TENANT_ID,
        start_date=start_yesterday,
        end_date=end_yesterday,
        time_range="yesterday"
    )

    print("=" * 85)
    print("RESUMEN V2 AYER (2026-07-31)")
    print("=" * 85)
    print(f"Ventas Brutas Overview: Bs. {res_y.get('overview', {}).get('ventas_brutas', 0):,.2f}")
    for k, d in res_y.get("desgloseSucursales", {}).items():
        print(f"  - {k:<12}: Ingresos = Bs. {d.get('ingresos', 0):>10.2f}")

    # 2. Rango Hoy (2026-08-01)
    start_today = datetime(2026, 8, 1, 4, 0, 0)
    end_today   = datetime(2026, 8, 2, 3, 59, 59, 999999)

    res_t = await get_dashboard_metrics_v2(
        tenant_id=TENANT_ID,
        start_date=start_today,
        end_date=end_today,
        time_range="today"
    )

    print("\n" + "=" * 85)
    print("RESUMEN V2 HOY (2026-08-01)")
    print("=" * 85)
    print(f"Ventas Brutas Overview: Bs. {res_t.get('overview', {}).get('ventas_brutas', 0):,.2f}")
    for k, d in res_t.get("desgloseSucursales", {}).items():
        print(f"  - {k:<12}: Ingresos = Bs. {d.get('ingresos', 0):>10.2f}")

if __name__ == "__main__":
    asyncio.run(main())
