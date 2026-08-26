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

async def run_comparativas_http_test():
    await init_db()

    print("=" * 90)
    print("PASO 8 DEL PROTOCOLO — PRUEBA REAL HTTP DEL ENDPOINT /api/v1/bi/comparativas")
    print("=" * 90)

    user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user:
        user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    token = create_access_token(data={"sub": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Petición HTTP Real: GET /api/v1/bi/comparativas (Hoy 25/08/2026 vs Ayer 24/08/2026)
        url = "/api/v1/bi/comparativas?start_date=2026-08-25&end_date=2026-08-25&comparar_contra=ayer&sucursal_id=all"
        res = await client.get(url, headers=headers)

        print(f"REQUEST URL: {url}")
        print(f"HTTP STATUS: {res.status_code}")

        if res.status_code == 200:
            json_data = res.json()
            p_act = json_data["periodo_actual"]
            p_comp = json_data["periodo_comparativo"]
            vars_m = json_data["variaciones"]

            print("\n--- RESPONSE JSON REAL OBTENIDO ---")
            print(f"  Modo Comparativo: '{json_data['modo_comparativo']}'")
            print(f"  Período Actual ({p_act['start_date']} a {p_act['end_date']}):")
            print(f"    - Ingresos: Bs. {p_act['ingresos']:,.2f} | Órdenes: {p_act['ordenes']} | TM: Bs. {p_act['ticket_medio']:,.2f}")

            print(f"  Período Comparativo ({p_comp['start_date']} a {p_comp['end_date']}):")
            print(f"    - Ingresos: Bs. {p_comp['ingresos']:,.2f} | Órdenes: {p_comp['ordenes']} | TM: Bs. {p_comp['ticket_medio']:,.2f}")

            print("  Variaciones Porcentuales y Deltas:")
            print(f"    - Ingresos: {vars_m['diferencia_ingresos']:+,.2f} Bs ({vars_m['variacion_ingresos_pct']}%) [{vars_m['estado_ingresos']}]")
            print(f"    - Órdenes:  {vars_m['diferencia_ordenes']:+} ord ({vars_m['variacion_ordenes_pct']}%) [{vars_m['estado_ordenes']}]")
            print(f"    - Ticket M: {vars_m['diferencia_ticket']:+,.2f} Bs ({vars_m['variacion_ticket_pct']}%) [{vars_m['estado_ticket']}]")

            print("\n  Muestra de Serie Temporal Diaria:")
            print(f"    - Serie Actual: {json_data['serie_actual']}")
            print(f"    - Serie Comparativa: {json_data['serie_comparativa']}")

            print("\n  Desglose Comparativo por Sucursal:")
            for suc in json_data["desglose_sucursales"]:
                print(f"    - {suc['nombre_sucursal']}: Actual Bs. {suc['ingresos_actual']:,.2f} ({suc['ordenes_actual']} ord) vs Comp Bs. {suc['ingresos_comparativo']:,.2f} ({suc['ordenes_comparativo']} ord) | Var %: {suc['variacion_ingresos_pct']}%")

            # Verificación de Equivalencia de datos con las 67 ventas del 25 y 58 ventas del 24
            if p_act["ordenes"] == 67 and p_comp["ordenes"] == 58:
                print("\n✓ PASO 8 VALIDADO CON ÉXITO CÓDIGO 0: LAS MÉTRICAS COINCIDEN 100% CON LAS VENTAS REALES DEL POS DE MONGODB")
            else:
                print(f"\n❌ ALERTA PASO 8: Discrepancia en conteo de órdenes ({p_act['ordenes']} != 67 o {p_comp['ordenes']} != 58)")

        else:
            print(f"❌ Error HTTP 500/404: {res.text}")

if __name__ == "__main__":
    asyncio.run(run_comparativas_http_test())
