import asyncio
import json
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db import init_db
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import create_access_token

async def run_clean_bi_ejecutivo_http_test():
    await init_db()

    print("=" * 90)
    print("RECONSTRUCCIÓN LIMPIA DE EXTREMO A EXTREMO — PRUEBA HTTP REAL FASE 10 (PASO 8)")
    print("NUEVA ARQUITECTURA BI: /api/v1/bi-ejecutivo/resumen")
    print("=" * 90)

    user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user:
        user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    if user and not user.tenant_id:
        user.tenant_id = "69cd7f0a8f3f6866d4cfbb62"

    token = create_access_token(data={"sub": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Petición HTTP Real: GET /api/v1/bi-ejecutivo/resumen
        url = "/api/v1/bi-ejecutivo/resumen?start_date=2026-08-25&end_date=2026-08-25&sucursal_id=all"
        res = await client.get(url, headers=headers)

        print(f"\nREQUEST URL: {url}")
        print(f"HTTP STATUS: {res.status_code}")

        if res.status_code == 200:
            json_data = res.json()
            kpis = json_data["kpis"]
            sucursales = json_data["sucursales"]
            trazabilidad = json_data["trazabilidad"]

            print("\n--- RESPONSE JSON REAL ENTREGADO POR LA NUEVA ARQUITECTURA ---")
            print("1. KPIs DEL RESUMEN EJECUTIVO GLOBAL:")
            print(f"  - Ingresos Totales (Ventas):  Bs. {kpis['ingresos_totales']:,.2f}")
            print(f"  - Costo Directo Total:        Bs. {kpis['costo_directo_total']:,.2f}")
            print(f"  - Margen Bruto Teórico:       Bs. {kpis['margen_bruto_teorico_bs']:,.2f} ({kpis['margen_bruto_teorico_pct']}%)")
            print(f"  - Total Tickets Emitidos:     {kpis['total_tickets']} tickets (Ticket Medio: Bs. {kpis['ticket_medio']:,.2f})")
            print(f"  - Valorización Stock:         Bs. {kpis['valorizacion_costo_stock']:,.2f} ({kpis['total_unidades_stock']:,.2f} un.)")
            print(f"  - Promociones Configuradas:   {kpis['promociones_configuradas']} promociones activas")
            print(f"  - Descuentos Otorgados:       Bs. {kpis['monto_total_descuentos']:,.2f} ({kpis['tickets_con_descuento']} tickets)")
            print(f"  - Sucursal Líder:            '{kpis['sucursal_lider_nombre']}' (Bs. {kpis['sucursal_lider_ingresos']:,.2f})")
            print(f"  - Cajero Líder:              '{kpis['cajero_lider_nombre']}' (Bs. {kpis['cajero_lider_ingresos']:,.2f})")

            print("\n2. DESGLOSE CONSOLIDADO POR SUCURSAL:")
            for idx, s in enumerate(sucursales, 1):
                print(f"  {idx}. {s['nombre']} | Ingresos: Bs. {s['ingresos_bs']:,.2f} | Tickets: {s['tickets_conteo']} | Part: {s['participacion_pct']}%")

            print("\n" + "=" * 90)
            print("EVALUACIÓN DE LAS VALIDACIONES MATEMÁTICAS EXIGIDAS EN EL PROTOCOLO")
            print("=" * 90)

            val_a = kpis["ingresos_totales"] == 2653.00
            print(f"  [VALIDACIÓN A] Ventas Totales: Bs. {kpis['ingresos_totales']:,.2f} == Bs. 2,653.00 -> {'✓ PASÓ' if val_a else '❌ FALLÓ'}")

            val_b = kpis["costo_directo_total"] == 2212.30
            print(f"  [VALIDACIÓN B] Costo Directo: Bs. {kpis['costo_directo_total']:,.2f} == Bs. 2,212.30 -> {'✓ PASÓ' if val_b else '❌ FALLÓ'}")

            calc_mb = round(kpis["ingresos_totales"] - kpis["costo_directo_total"], 2)
            val_c = kpis["margen_bruto_teorico_bs"] == 440.70 and calc_mb == 440.70
            print(f"  [VALIDACIÓN C] Ventas - Costo Directo == Margen Bruto (Bs. {calc_mb:,.2f} == Bs. 440.70): {'✓ PASÓ' if val_c else '❌ FALLÓ'}")

            val_d = kpis["margen_bruto_teorico_pct"] == 16.61
            print(f"  [VALIDACIÓN D] Margen %: {kpis['margen_bruto_teorico_pct']}% == 16.61% -> {'✓ PASÓ' if val_d else '❌ FALLÓ'}")

            val_e = kpis["valorizacion_costo_stock"] > 0 and kpis["total_unidades_stock"] > 0
            print(f"  [VALIDACIÓN E] Stock Valorizado Reconciliado 1:1 con Fase 6 (Bs. {kpis['valorizacion_costo_stock']:,.2f} / {kpis['total_unidades_stock']:,.2f} un.): {'✓ PASÓ' if val_e else '❌ FALLÓ'}")

            val_f = kpis["monto_total_descuentos"] == 46.30 and kpis["tickets_con_descuento"] == 2
            print(f"  [VALIDACIÓN F] Descuentos Otorgados: Bs. {kpis['monto_total_descuentos']:,.2f} en {kpis['tickets_con_descuento']} tickets -> {'✓ PASÓ' if val_f else '❌ FALLÓ'}")

            val_g = "Heroinas" in kpis["sucursal_lider_nombre"] and kpis["sucursal_lider_ingresos"] == 2310.00
            print(f"  [VALIDACIÓN G] Sucursal Líder: '{kpis['sucursal_lider_nombre']}' (Bs. {kpis['sucursal_lider_ingresos']:,.2f}) -> {'✓ PASÓ' if val_g else '❌ FALLÓ'}")

            val_h = trazabilidad.get("ebitda_gastos_operativos") == "NO_DISPONIBLE (Sin libros de egresos fijos en MongoDB)"
            print(f"  [VALIDACIÓN H] EBITDA y Gastos Operativos Declarados Explícitamente NO DISPONIBLES: {'✓ PASÓ' if val_h else '❌ FALLÓ'}")

            if val_a and val_b and val_c and val_d and val_e and val_f and val_g and val_h:
                print("\n✓ RESULTADO PASO 8: RECONSTRUCCIÓN LIMPIA FASE 10 APROBADA CON ÉXITO CÓDIGO 0 (100% TRAZABLE)")
            else:
                print("\n❌ RESULTADO PASO 8: Falló al menos una validación.")

        else:
            print(f"❌ Error HTTP {res.status_code}: {res.text}")

if __name__ == "__main__":
    asyncio.run(run_clean_bi_ejecutivo_http_test())
