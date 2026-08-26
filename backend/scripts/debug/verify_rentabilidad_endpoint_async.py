import asyncio
import json
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db import init_db
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import create_access_token

async def run_clean_bi_rentabilidad_http_test():
    await init_db()

    print("=" * 90)
    print("RECONSTRUCCIÓN LIMPIA DE EXTREMO A EXTREMO — PRUEBA HTTP REAL FASE 7 (PASO 8)")
    print("NUEVA ARQUITECTURA BI: /api/v1/bi-rentabilidad/margen")
    print("=" * 90)

    user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user:
        user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    token = create_access_token(data={"sub": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Petición HTTP Real: GET /api/v1/bi-rentabilidad/margen
        url = "/api/v1/bi-rentabilidad/margen?start_date=2026-08-25&end_date=2026-08-25&sucursal_id=all"
        res = await client.get(url, headers=headers)

        print(f"\nREQUEST URL: {url}")
        print(f"HTTP STATUS: {res.status_code}")

        if res.status_code == 200:
            json_data = res.json()
            kpis = json_data["kpis"]
            cats = json_data["categorias"]
            top_prods = json_data["top_productos"]
            trazabilidad = json_data["trazabilidad"]

            print("\n--- RESPONSE JSON REAL ENTREGADO POR LA NUEVA ARQUITECTURA ---")
            print("1. KPIs DE RENTABILIDAD TEÓRICA Y MARGEN BRUTO:")
            print(f"  - Ingresos Totales Conciliados: Bs. {kpis['ingresos_totales']:,.2f}")
            print(f"  - Costo Directo Total:           Bs. {kpis['costo_directo_total']:,.2f}")
            print(f"  - MARGEN BRUTO TEÓRICO GLOBAL (Bs.): Bs. {kpis['margen_bruto_teorico_bs']:,.2f}")
            print(f"  - MARGEN BRUTO TEÓRICO GLOBAL (%):   {kpis['margen_bruto_teorico_pct']}%")
            print(f"  - Total Líneas Procesadas: {kpis['total_lineas_procesadas']}")
            print(f"  - Producto Mayor Margen: '{kpis['producto_mayor_margen_nombre']}' (Bs. {kpis['producto_mayor_margen_monto']:,.2f})")

            print("\n2. TOP 5 PRODUCTOS DE MAYOR MARGEN BRUTO EN VENTAS:")
            for idx, p in enumerate(top_prods[:5], 1):
                print(f"  {idx}. [{p['categoria_nombre']}] {p['nombre']} | Ingresos: Bs. {p['ingresos_bs']:,.2f} | Costo: Bs. {p['costos_bs']:,.2f} | Margen: Bs. {p['margen_bruto_bs']:,.2f} ({p['margen_bruto_pct']}%)")

            print("\n" + "=" * 90)
            print("EVALUACIÓN DE LAS VALIDACIONES MATEMÁTICAS EXIGIDAS EN EL PROTOCOLO")
            print("=" * 90)

            val_a = kpis["ingresos_totales"] == 2653.00
            print(f"  [VALIDACIÓN A] Ingresos Totales Conciliados: Bs. {kpis['ingresos_totales']:,.2f} == Bs. 2,653.00 -> {'✓ PASÓ' if val_a else '❌ FALLÓ'}")

            val_b = kpis["costo_directo_total"] == 2212.30
            print(f"  [VALIDACIÓN B] Costo Directo Total: Bs. {kpis['costo_directo_total']:,.2f} == Bs. 2,212.30 -> {'✓ PASÓ' if val_b else '❌ FALLÓ'}")

            val_c = kpis["margen_bruto_teorico_bs"] == 440.70
            print(f"  [VALIDACIÓN C] Margen Bruto Teórico (Bs.): Bs. {kpis['margen_bruto_teorico_bs']:,.2f} == Bs. 440.70 -> {'✓ PASÓ' if val_c else '❌ FALLÓ'}")

            val_d = kpis["margen_bruto_teorico_pct"] == 16.61
            print(f"  [VALIDACIÓN D] Margen Bruto Teórico (%): {kpis['margen_bruto_teorico_pct']}% == 16.61% -> {'✓ PASÓ' if val_d else '❌ FALLÓ'}")

            sum_margen_prods = round(sum(p["margen_bruto_bs"] for p in top_prods), 2)
            val_e = sum_margen_prods == kpis["margen_bruto_teorico_bs"]
            print(f"  [VALIDACIÓN E] SUM(margen_bruto_productos) == margen_bruto_global (Bs. {sum_margen_prods:,.2f} == Bs. {kpis['margen_bruto_teorico_bs']:,.2f}): {'✓ PASÓ' if val_e else '❌ FALLÓ'}")

            sum_ing_prods = round(sum(p["ingresos_bs"] for p in top_prods), 2)
            sum_cost_prods = round(sum(p["costos_bs"] for p in top_prods), 2)
            diff_margen = round(sum_ing_prods - sum_cost_prods, 2)
            val_f = diff_margen == kpis["margen_bruto_teorico_bs"]
            print(f"  [VALIDACIÓN F] SUM(ingresos) - SUM(costos) == margen_bruto_global (Bs. {sum_ing_prods:,.2f} - Bs. {sum_cost_prods:,.2f} = Bs. {diff_margen:,.2f}): {'✓ PASÓ' if val_f else '❌ FALLÓ'}")

            val_g = trazabilidad.get("gastos_operativos") == "NO_DISPONIBLE (Sin registros de gastos fijos/salarios en MongoDB)"
            print(f"  [VALIDACIÓN G] Gastos Operativos / EBITDA Declarados Explícitamente NO DISPONIBLES: {'✓ PASÓ' if val_g else '❌ FALLÓ'}")

            if val_a and val_b and val_c and val_d and val_e and val_f and val_g:
                print("\n✓ RESULTADO PASO 8: RECONSTRUCCIÓN LIMPIA FASE 7 APROBADA CON ÉXITO CÓDIGO 0 (100% TRAZABLE)")
            else:
                print("\n❌ RESULTADO PASO 8: Falló al menos una validación.")

        else:
            print(f"❌ Error HTTP {res.status_code}: {res.text}")

if __name__ == "__main__":
    asyncio.run(run_clean_bi_rentabilidad_http_test())
