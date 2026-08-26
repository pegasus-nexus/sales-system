import asyncio
import json
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db import init_db
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import create_access_token

async def run_clean_bi_sucursales_http_test():
    await init_db()

    print("=" * 90)
    print("RECONSTRUCCIÓN LIMPIA DE EXTREMO A EXTREMO — PRUEBA HTTP REAL FASE 5 (PASO 8)")
    print("NUEVA ARQUITECTURA BI: /api/v1/bi-sucursales/desempeno")
    print("=" * 90)

    user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user:
        user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    token = create_access_token(data={"sub": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Petición HTTP Real: GET /api/v1/bi-sucursales/desempeno (25/08/2026)
        url = "/api/v1/bi-sucursales/desempeno?start_date=2026-08-25&end_date=2026-08-25&sucursal_id=all"
        res = await client.get(url, headers=headers)

        print(f"\nREQUEST URL: {url}")
        print(f"HTTP STATUS: {res.status_code}")

        if res.status_code == 200:
            json_data = res.json()
            kpis = json_data["kpis"]
            sucursales = json_data["sucursales"]
            trazabilidad = json_data["trazabilidad"]

            print("\n--- RESPONSE JSON REAL ENTREGADO POR LA NUEVA ARQUITECTURA ---")
            print("1. KPIs DE DESEMPEÑO POR SUCURSALES:")
            print(f"  - Total Ingresos Globales: Bs. {kpis['ingresos_totales']:,.2f} ({kpis['total_tickets']} tickets)")
            print(f"  - Ticket Medio Global: Bs. {kpis['ticket_medio_global']:,.2f}/ticket")
            print(f"  - Sucursales Activas con Venta: {kpis['total_sucursales_activas_con_venta']}")
            print(f"  - Sucursal Líder: '{kpis['sucursal_lider_nombre']}' (Bs. {kpis['sucursal_lider_ingresos']:,.2f})")
            print(f"  - Mayor Ticket Medio: '{kpis['sucursal_mayor_ticket_medio_nombre']}' (Bs. {kpis['sucursal_mayor_ticket_medio_monto']:,.2f})")

            print("\n2. DESGLOSE POR SUCURSALES / TIENDAS:")
            sum_suc_ingresos = 0.0
            sum_suc_tickets = 0

            for s in sucursales:
                print(f"  - {s['nombre']} ({s['ciudad']}): Bs. {s['ingresos_bs']:>10,.2f} ({s['tickets_conteo']} tks) | TM: Bs. {s['ticket_medio']:>7,.2f} | Part: {s['participacion_pct']}%")
                sum_suc_ingresos += s["ingresos_bs"]
                sum_suc_tickets += s["tickets_conteo"]

            print("\n" + "=" * 90)
            print("EVALUACIÓN DE LAS VALIDACIONES MATEMÁTICAS EXIGIDAS EN EL PROTOCOLO")
            print("=" * 90)

            val_a = kpis["total_tickets"] == 67 and kpis["ingresos_totales"] == 2653.00
            print(f"  [VALIDACIÓN A] Base de Ventas del Día: {kpis['total_tickets']} tickets / Bs. {kpis['ingresos_totales']:,.2f} -> {'✓ PASÓ' if val_a else '❌ FALLÓ'}")

            val_b = sum_suc_tickets == 67 and round(sum_suc_ingresos, 2) == 2653.00
            print(f"  [VALIDACIÓN B] Suma por Sucursales == sales.total (Bs. 2,653.00 == Bs. 2,653.00, Cero Dif): {'✓ PASÓ' if val_b else '❌ FALLÓ'}")

            heroinas = next((s for s in sucursales if "Heroinas" in s["nombre"]), None)
            val_c = heroinas is not None and heroinas["tickets_conteo"] == 48 and heroinas["ingresos_bs"] == 2310.00
            print(f"  [VALIDACIÓN C] Suc. Heroinas (48 tks / Bs. 2,310.00): {'✓ PASÓ' if val_c else '❌ FALLÓ'}")

            recoleta = next((s for s in sucursales if "Recoleta" in s["nombre"]), None)
            val_d = recoleta is not None and recoleta["tickets_conteo"] == 10 and recoleta["ingresos_bs"] == 209.50
            print(f"  [VALIDACIÓN D] Suc. Recoleta (10 tks / Bs. 209.50): {'✓ PASÓ' if val_d else '❌ FALLÓ'}")

            calacoto = next((s for s in sucursales if "Calacoto" in s["nombre"]), None)
            val_e = calacoto is not None and calacoto["tickets_conteo"] == 9 and calacoto["ingresos_bs"] == 133.50
            print(f"  [VALIDACIÓN E] Suc. Calacoto (9 tks / Bs. 133.50): {'✓ PASÓ' if val_e else '❌ FALLÓ'}")

            empty_url = "/api/v1/bi-sucursales/desempeno?start_date=2026-09-01&end_date=2026-09-01&sucursal_id=all"
            res_empty = await client.get(empty_url, headers=headers)
            val_f = res_empty.status_code == 200 and res_empty.json()["kpis"]["total_tickets"] == 0 and res_empty.json()["sucursales"] == []
            print(f"  [VALIDACIÓN F] Respuesta HTTP 200 Vacía sin Mocks: {'✓ PASÓ' if val_f else '❌ FALLÓ'}")

            if val_a and val_b and val_c and val_d and val_e and val_f:
                print("\n✓ RESULTADO PASO 8: RECONSTRUCCIÓN LIMPIA FASE 5 APROBADA CON ÉXITO CÓDIGO 0 (100% TRAZABLE)")
            else:
                print("\n❌ RESULTADO PASO 8: Falló al menos una validación.")

        else:
            print(f"❌ Error HTTP {res.status_code}: {res.text}")

if __name__ == "__main__":
    asyncio.run(run_clean_bi_sucursales_http_test())
