# -*- coding: utf-8 -*-
"""
Script de verificación empírica de respuestas HTTP y rangos de fecha en Dashboard V2.
"""
import asyncio
import sys
import json
from datetime import datetime

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

async def main():
    from app.db import init_db
    from app.services.analytics_v2_service import get_dashboard_metrics_v2

    await init_db()

    print("==========================================================================")
    print("DEMOSTRACIÓN DE VALORES RETORNADOS SEGÚN RANGO DE FECHAS EN TIEMPO DE EJECUCIÓN")
    print("==========================================================================")

    # Rango 1: Inicialización por defecto en DashboardMaestro.tsx (2024-01-01 a 2026-12-31)
    res_default = await get_dashboard_metrics_v2(
        tenant_id=TENANT_ID,
        start_date=datetime(2024, 1, 1, 0, 0, 0),
        end_date=datetime(2026, 12, 31, 23, 59, 59),
        time_range="custom"
    )
    v_default = res_default.get("overview", {}).get("ventas_brutas", 0)
    print(f"\n1. RANGO INICIAL DE ESTADO (2024-01-01 a 2026-12-31):")
    print(f"   ventas_brutas = Bs. {v_default:,.2f}")

    # Rango 2: Ayer (2026-07-31 BOT)
    res_yesterday = await get_dashboard_metrics_v2(
        tenant_id=TENANT_ID,
        start_date=datetime(2026, 7, 31, 4, 0, 0),
        end_date=datetime(2026, 8, 1, 3, 59, 59, 999999),
        time_range="yesterday"
    )
    v_yesterday = res_yesterday.get("overview", {}).get("ventas_brutas", 0)
    print(f"\n2. RANGO AYER (2026-07-31):")
    print(f"   ventas_brutas = Bs. {v_yesterday:,.2f}")
    print(f"   Desglose: {json.dumps(res_yesterday.get('desgloseSucursales', {}), indent=2, ensure_ascii=False)}")

    # Rango 3: Hoy (2026-08-01 BOT)
    res_today = await get_dashboard_metrics_v2(
        tenant_id=TENANT_ID,
        start_date=datetime(2026, 8, 1, 4, 0, 0),
        end_date=datetime(2026, 8, 2, 3, 59, 59, 999999),
        time_range="today"
    )
    v_today = res_today.get("overview", {}).get("ventas_brutas", 0)
    print(f"\n3. RANGO HOY (2026-08-01):")
    print(f"   ventas_brutas = Bs. {v_today:,.2f}")
    print(f"   Desglose: {json.dumps(res_today.get('desgloseSucursales', {}), indent=2, ensure_ascii=False)}")

if __name__ == "__main__":
    asyncio.run(main())
