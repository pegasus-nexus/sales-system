import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db import init_db, get_raw_db
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import create_access_token
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)

async def run_e2e_comparison():
    await init_db()
    db = await get_raw_db()

    print("=" * 80)
    print("AUDITORÍA DE EXTREMO A EXTREMO (HTTP ASGI -> FASTAPI -> MONGODB)")
    print("=" * 80)

    user_admin_matriz = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user_admin_matriz:
        user_admin_matriz = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    print(f"Usuario autenticado para la prueba: {user_admin_matriz.email}")
    print(f"  Rol: {user_admin_matriz.role} | Tenant ID: '{user_admin_matriz.tenant_id}'")

    token = create_access_token(data={"sub": user_admin_matriz.email})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Petición HTTP a GET /api/v1/sales (Historial de Ventas del 25/08/2026)
        sales_url = "/api/v1/sales?start_date=2026-08-25&end_date=2026-08-25&limit=100"
        res_hist = await client.get(sales_url, headers=headers)
        print(f"\n[REQUEST 1]: GET {sales_url}")
        print(f"  Status Code: {res_hist.status_code}")

        if res_hist.status_code == 200:
            data_hist = res_hist.json()
            hist_items = data_hist.get("items", [])
            hist_count = len(hist_items)
            hist_total = sum(float(s.get("total", 0.0)) for s in hist_items if not s.get("anulada"))
            print(f"  [HISTORIAL ENDPOINT]: Ventas = {hist_count} | Suma Total = Bs. {hist_total:,.2f}")
        else:
            print(f"  [HISTORIAL ERROR]: {res_hist.text}")
            hist_count = 0
            hist_total = 0.0

        # 2. Petición HTTP a GET /api/v1/bi/panel-general (Panel General BI del 25/08/2026)
        bi_url = "/api/v1/bi/panel-general?start_date=2026-08-25&end_date=2026-08-25&sucursal_id=all"
        res_bi = await client.get(bi_url, headers=headers)
        print(f"\n[REQUEST 2]: GET {bi_url}")
        print(f"  Status Code: {res_bi.status_code}")

        if res_bi.status_code == 200:
            data_bi = res_bi.json()
            bi_count = data_bi.get("cantidad_ordenes", 0)
            bi_total = data_bi.get("ingresos_totales", 0.0)
            bi_ticket = data_bi.get("ticket_medio", 0.0)
            print(f"  [BI PANEL ENDPOINT]:   Ventas = {bi_count} | Suma Total = Bs. {bi_total:,.2f} | Ticket Medio = Bs. {bi_ticket:,.2f}")
            print("  [DESGLOSE SUCURSALES BI]:")
            for s in data_bi.get("desglose_sucursales", []):
                if s.get("ordenes", 0) > 0 or s.get("ingresos", 0) > 0:
                    print(f"    - {s.get('nombre_sucursal')}: Bs. {s.get('ingresos'):,.2f} ({s.get('ordenes')} ord, {s.get('participacion_pct')}%)")
        else:
            print(f"  [BI ERROR]: {res_bi.text}")
            bi_count = -1
            bi_total = -1.0

    # 3. MATRIZ DE DIAGNÓSTICO COMPARATIVO OBLIGATORIA
    print("\n" + "=" * 60)
    print("MATRIZ DE DIAGNÓSTICO COMPARATIVO EXTREMO A EXTREMO (25/08/2026)")
    print("=" * 60)
    print(f"  {'MÉTRICA':<22} | {'HISTORIAL (/sales)':<20} | {'PANEL GENERAL BI':<20}")
    print("-" * 60)
    print(f"  {'Tickets / Órdenes':<22} | {hist_count:<20} | {bi_count:<20}")
    print(f"  {'Suma Total (Bs.)':<22} | {hist_total:<20.2f} | {bi_total:<20.2f}")
    print("=" * 60)

    if hist_count == bi_count and abs(hist_total - bi_total) < 0.01:
        print("\n✓ RESULTADO VERIFICADO: 100% EQUIVALENCIA EXACTA ENTRE HISTORIAL Y BI EN HTTP ENDPOINTS")
    else:
        print("\n❌ ALERTA: DISCREPANCIA DETECTADA ENTRE HISTORIAL Y BI")

if __name__ == "__main__":
    asyncio.run(run_e2e_comparison())
