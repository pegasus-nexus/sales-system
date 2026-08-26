import asyncio
import json
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db import init_db
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import create_access_token

async def run_clean_bi_productividad_http_test():
    await init_db()

    print("=" * 90)
    print("RECONSTRUCCIÓN LIMPIA DE EXTREMO A EXTREMO — PRUEBA HTTP REAL FASE 9 (PASO 8)")
    print("NUEVA ARQUITECTURA BI: /api/v1/bi-productividad/desempeno")
    print("=" * 90)

    user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user:
        user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    token = create_access_token(data={"sub": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Petición HTTP Real: GET /api/v1/bi-productividad/desempeno
        url = "/api/v1/bi-productividad/desempeno?sucursal_id=all"
        res = await client.get(url, headers=headers)

        print(f"\nREQUEST URL: {url}")
        print(f"HTTP STATUS: {res.status_code}")

        if res.status_code == 200:
            json_data = res.json()
            kpis = json_data["kpis"]
            cajeros = json_data["cajeros"]
            auditoria = json_data["auditoria_eventos"]
            trazabilidad = json_data["trazabilidad"]

            print("\n--- RESPONSE JSON REAL ENTREGADO POR LA NUEVA ARQUITECTURA ---")
            print("1. KPIs DE PRODUCTIVIDAD Y DESEMPEÑO DE CAJEROS:")
            print(f"  - Ingresos Totales Procesados: Bs. {kpis['ingresos_totales']:,.2f}")
            print(f"  - Total Tickets Procesados:    {kpis['total_tickets']} tickets")
            print(f"  - Cajeros Activos con Venta:   {kpis['cajeros_activos_con_venta']}")
            print(f"  - Cajero Líder:               '{kpis['cajero_lider_nombre']}' (Bs. {kpis['cajero_lider_ingresos']:,.2f})")
            print(f"  - Mayor Ticket Medio:         '{kpis['cajero_mayor_ticket_medio_nombre']}' (Bs. {kpis['cajero_mayor_ticket_medio_monto']:,.2f})")
            print(f"  - Eventos de Auditoría:        {kpis['total_eventos_auditoria']} eventos")

            print("\n2. TOP 5 CAJEROS / OPERADORES POR FACTURACIÓN:")
            for idx, c in enumerate(cajeros[:5], 1):
                print(f"  {idx}. {c['cajero_nombre']} | Tickets: {c['tickets_conteo']} | Ingresos: Bs. {c['ingresos_bs']:,.2f} | Ticket Medio: Bs. {c['ticket_medio']:,.2f} | Part: {c['participacion_pct']}%")

            print("\n" + "=" * 90)
            print("EVALUACIÓN DE LAS VALIDACIONES MATEMÁTICAS EXIGIDAS EN EL PROTOCOLO")
            print("=" * 90)

            sum_ingresos_cajeros = round(sum(c["ingresos_bs"] for c in cajeros), 2)
            val_a = sum_ingresos_cajeros == kpis["ingresos_totales"]
            print(f"  [VALIDACIÓN A] SUM(ingresos_cajeros) == ingresos_totales (Bs. {sum_ingresos_cajeros:,.2f} == Bs. {kpis['ingresos_totales']:,.2f}): {'✓ PASÓ' if val_a else '❌ FALLÓ'}")

            sum_tickets_cajeros = sum(c["tickets_conteo"] for c in cajeros)
            val_b = sum_tickets_cajeros == kpis["total_tickets"]
            print(f"  [VALIDACIÓN B] SUM(tickets_cajeros) == total_tickets ({sum_tickets_cajeros} == {kpis['total_tickets']}): {'✓ PASÓ' if val_b else '❌ FALLÓ'}")

            val_c = kpis["cajeros_activos_con_venta"] == len(cajeros)
            print(f"  [VALIDACIÓN C] Cajeros Activos con Venta == len(cajeros) ({kpis['cajeros_activos_con_venta']} == {len(cajeros)}): {'✓ PASÓ' if val_c else '❌ FALLÓ'}")

            val_d = trazabilidad.get("horas_trabajadas_eficiencia") == "NO_DISPONIBLE (Sin marcado de asistencia ni reloj marcador en MongoDB)"
            print(f"  [VALIDACIÓN D] Horas Trabajadas y Eficiencia Declaradas Explícitamente NO DISPONIBLES: {'✓ PASÓ' if val_d else '❌ FALLÓ'}")

            val_e = trazabilidad.get("alertas_fraude") == "NO_DISPONIBLE (Sin reglas de auditoria de fraude en MongoDB)"
            print(f"  [VALIDACIÓN E] Alertas de Fraude y Sospecha Declaradas Explícitamente NO DISPONIBLES: {'✓ PASÓ' if val_e else '❌ FALLÓ'}")

            if val_a and val_b and val_c and val_d and val_e:
                print("\n✓ RESULTADO PASO 8: RECONSTRUCCIÓN LIMPIA FASE 9 APROBADA CON ÉXITO CÓDIGO 0 (100% TRAZABLE)")
            else:
                print("\n❌ RESULTADO PASO 8: Falló al menos una validación.")

        else:
            print(f"❌ Error HTTP {res.status_code}: {res.text}")

if __name__ == "__main__":
    asyncio.run(run_clean_bi_productividad_http_test())
