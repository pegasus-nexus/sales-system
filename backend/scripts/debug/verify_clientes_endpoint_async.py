import asyncio
import json
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db import init_db
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import create_access_token

async def run_clean_bi_clientes_http_test():
    await init_db()

    print("=" * 90)
    print("RECONSTRUCCIÓN LIMPIA DE EXTREMO A EXTREMO — PRUEBA HTTP REAL FASE 4 (PASO 8)")
    print("NUEVA ARQUITECTURA BI: /api/v1/bi-clientes/clientes")
    print("=" * 90)

    user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user:
        user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    token = create_access_token(data={"sub": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Petición HTTP Real: GET /api/v1/bi-clientes/clientes (25/08/2026)
        url = "/api/v1/bi-clientes/clientes?start_date=2026-08-25&end_date=2026-08-25&sucursal_id=all"
        res = await client.get(url, headers=headers)

        print(f"\nREQUEST URL: {url}")
        print(f"HTTP STATUS: {res.status_code}")

        if res.status_code == 200:
            json_data = res.json()
            kpis = json_data["kpis"]
            metodos = json_data["metodos_pago"]
            top_cli = json_data["top_clientes"]
            credito = json_data["resumen_credito"]
            trazabilidad = json_data["trazabilidad"]

            print("\n--- RESPONSE JSON REAL ENTREGADO POR LA NUEVA ARQUITECTURA ---")
            print("1. KPIs DE CLIENTES Y VENTAS:")
            print(f"  - Total Ingresos Sales: Bs. {kpis['ingresos_totales']:,.2f} ({kpis['total_tickets']} tickets)")
            print(f"  - Ventas Nominadas: {kpis['ventas_nominadas_tickets']} tickets | Bs. {kpis['ventas_nominadas_monto']:,.2f}")
            print(f"  - Ventas Mostrador (Anónimas): {kpis['ventas_anonimas_tickets']} tickets | Bs. {kpis['ventas_anonimas_monto']:,.2f}")
            print(f"  - Top Cliente Nominado: '{kpis['top_cliente_nombre']}' (Bs. {kpis['top_cliente_monto']:,.2f})")

            print("\n2. DESGLOSE MATEMÁTICO REAL DE MÉTODOS DE PAGO NETOS:")
            sum_pagos_netos = 0.0
            for m in metodos:
                print(f"  - {m['metodo']:<12}: Bs. {m['monto_neto']:>10,.2f} ({m['tickets_conteo']} tickets) | Part: {m['participacion_pct']}%")
                sum_pagos_netos += m["monto_neto"]

            print("\n3. RESUMEN DE CARTERA DE CRÉDITO:")
            print(f"  - Total Cuentas Crédito: {credito['total_cuentas_credito']}")
            print(f"  - Saldo Total Cartera: Bs. {credito['saldo_total_cartera']:,.2f}")
            print(f"  - Cuentas Al Día: {credito['cuentas_al_dia']} | Cuentas en Mora: {credito['cuentas_mora']}")

            print("\n" + "=" * 90)
            print("EVALUACIÓN DE LAS VALIDACIONES MATEMÁTICAS EXIGIDAS EN EL PROTOCOLO")
            print("=" * 90)

            # Validaciones para el 25/08/2026
            val_a = kpis["total_tickets"] == 67 and kpis["ingresos_totales"] == 2653.00
            print(f"  [VALIDACIÓN A] Base de Ventas del Día: {kpis['total_tickets']} tickets / Bs. {kpis['ingresos_totales']:,.2f} -> {'✓ PASÓ' if val_a else '❌ FALLÓ'}")

            val_b = kpis["ventas_nominadas_tickets"] == 2 and kpis["ventas_nominadas_monto"] == 41.00
            print(f"  [VALIDACIÓN B] Ventas Nominadas: 2 tickets / Bs. 41.00 -> {'✓ PASÓ' if val_b else '❌ FALLÓ'}")

            val_c = kpis["ventas_anonimas_tickets"] == 65 and kpis["ventas_anonimas_monto"] == 2612.00
            print(f"  [VALIDACIÓN C] Ventas Mostrador (Anónimas): 65 tickets / Bs. 2,612.00 -> {'✓ PASÓ' if val_c else '❌ FALLÓ'}")

            sum_cl_calc = kpis["ventas_nominadas_monto"] + kpis["ventas_anonimas_monto"]
            val_d = sum_cl_calc == kpis["ingresos_totales"]
            print(f"  [VALIDACIÓN D] Suma Nominadas + Anónimas == sales.total (Diferencia Bs. 0.00): {'✓ PASÓ' if val_d else '❌ FALLÓ'}")

            efectivo_m = next((m["monto_neto"] for m in metodos if m["metodo"] == "EFECTIVO"), 0.0)
            qr_m = next((m["monto_neto"] for m in metodos if m["metodo"] == "QR"), 0.0)
            val_e = efectivo_m == 1700.48 and qr_m == 952.52
            print(f"  [VALIDACIÓN E] Cobro Neto por Método (EFECTIVO: Bs. 1,700.48 | QR: Bs. 952.52): {'✓ PASÓ' if val_e else '❌ FALLÓ'}")

            val_f = round(sum_pagos_netos, 2) == 2653.00
            print(f"  [VALIDACIÓN F] SUM(pagos_netos) == SUM(sales.total) (Bs. 2,653.00 == Bs. 2,653.00, Cero Dif): {'✓ PASÓ' if val_f else '❌ FALLÓ'}")

            # Prueba de período sin ventas
            empty_url = "/api/v1/bi-clientes/clientes?start_date=2026-09-01&end_date=2026-09-01&sucursal_id=all"
            res_empty = await client.get(empty_url, headers=headers)
            val_g = res_empty.status_code == 200 and res_empty.json()["kpis"]["total_tickets"] == 0 and res_empty.json()["metodos_pago"] == []
            print(f"  [VALIDACIÓN G] Respuesta HTTP 200 Vacía sin Mocks: {'✓ PASÓ' if val_g else '❌ FALLÓ'}")

            if val_a and val_b and val_c and val_d and val_e and val_f and val_g:
                print("\n✓ RESULTADO PASO 8: RECONSTRUCCIÓN LIMPIA FASE 4 APROBADA CON ÉXITO CÓDIGO 0 (100% TRAZABLE)")
            else:
                print("\n❌ RESULTADO PASO 8: Falló al menos una validación.")

        else:
            print(f"❌ Error HTTP {res.status_code}: {res.text}")

if __name__ == "__main__":
    asyncio.run(run_clean_bi_clientes_http_test())
