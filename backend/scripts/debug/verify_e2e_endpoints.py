import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi.testclient import TestClient

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
    print("AUDITORÍA DE EXTREMO A EXTREMO (HTTP CLIENT -> FASTAPI -> MONGODB)")
    print("=" * 80)

    # 1. Obtener usuario ADMIN_MATRIZ (admin.general.taboada@taboada.bo)
    user_admin_matriz = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user_admin_matriz:
        user_admin_matriz = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    print(f"Usuario autenticado para la prueba: {user_admin_matriz.email}")
    print(f"  Rol: {user_admin_matriz.role} | Tenant ID: '{user_admin_matriz.tenant_id}'")

    # 2. Generar Token JWT de autenticación para el TestClient
    token = create_access_token(data={"sub": user_admin_matriz.email})
    headers = {"Authorization": f"Bearer {token}"}

    client = TestClient(app)

    # 3. Petición al Endpoint de Historial de Ventas (GET /api/v1/sales)
    sales_hist_url = "/api/v1/sales?start_date=2026-08-24&end_date=2026-08-24&limit=100"
    res_hist = client.get(sales_hist_url, headers=headers)
    
    print(f"\n[REQUEST 1]: GET {sales_hist_url}")
    print(f"  Response Status: {res_hist.status_code}")
    
    if res_hist.status_code == 200:
        data_hist = res_hist.json()
        hist_items = data_hist.get("items", [])
        hist_count = len(hist_items)
        hist_total = sum(float(s.get("total", 0.0)) for s in hist_items if not s.get("anulada"))
        print(f"  [HISTORIAL]: Ventas encontradas = {hist_count} | Suma Total = Bs. {hist_total:,.2f}")
    else:
        print(f"  [HISTORIAL ERROR]: {res_hist.text}")
        hist_count = 0
        hist_total = 0.0

    # 4. Petición al Endpoint de Panel General BI (GET /api/v1/bi/panel-general)
    bi_url = "/api/v1/bi/panel-general?start_date=2026-08-24&end_date=2026-08-24&sucursal_id=all"
    res_bi = client.get(bi_url, headers=headers)

    print(f"\n[REQUEST 2]: GET {bi_url}")
    print(f"  Response Status: {res_bi.status_code}")

    if res_bi.status_code == 200:
        data_bi = res_bi.json()
        bi_count = data_bi.get("cantidad_ordenes", 0)
        bi_total = data_bi.get("ingresos_totales", 0.0)
        bi_ticket = data_bi.get("ticket_medio", 0.0)
        print(f"  [BI PANEL]:   Ventas encontradas = {bi_count} | Suma Total = Bs. {bi_total:,.2f} | Ticket Medio = Bs. {bi_ticket:,.2f}")
        print("  [DESGLOSE SUCURSALES BI]:")
        for s in data_bi.get("desglose_sucursales", []):
            print(f"    - {s.get('nombre_sucursal')}: Bs. {s.get('ingresos'):,.2f} ({s.get('ordenes')} ord, {s.get('participacion_pct')}%)")
    else:
        print(f"  [BI ERROR]: {res_bi.text}")
        bi_count = -1
        bi_total = -1.0

    # 5. MATRIZ DE DIAGNÓSTICO COMPARATIVO
    print("\n" + "=" * 50)
    print("MATRIZ DE DIAGNÓSTICO COMPARATIVO EXTREMO A EXTREMO")
    print("=" * 50)
    print(f"  {'METRICA':<20} | {'HISTORIAL':<12} | {'PANEL GENERAL BI':<15}")
    print("-" * 50)
    print(f"  {'Tickets / Órdenes':<20} | {hist_count:<12} | {bi_count:<15}")
    print(f"  {'Suma Total (Bs.)':<20} | {hist_total:<12.2f} | {bi_total:<15.2f}")
    print("=" * 50)

    if hist_count == bi_count and abs(hist_total - bi_total) < 0.01:
        print("✓ DIAGNÓSTICO CONCLUYENTE: HISTORIAL Y BI PRODUCEN 100% LOS MISMOS RESULTADOS")
    else:
        print("❌ DISCREPANCIA DETECTADA EN EL CLIENTE DE PRUEBA")

if __name__ == "__main__":
    asyncio.run(run_e2e_comparison())
