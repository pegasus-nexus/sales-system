import asyncio
import json
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db import init_db
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import create_access_token

async def run_clean_bi_productos_http_test():
    await init_db()

    print("=" * 90)
    print("RECONSTRUCCIÓN LIMPIA DE EXTREMO A EXTREMO — PRUEBA HTTP REAL Y CONCILIACIÓN MATEMÁTICA")
    print("NUEVA ARQUITECTURA BI: /api/v1/bi-productos/productos")
    print("=" * 90)

    user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user:
        user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    token = create_access_token(data={"sub": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Petición HTTP Real: GET /api/v1/bi-productos/productos (25/08/2026)
        url = "/api/v1/bi-productos/productos?start_date=2026-08-25&end_date=2026-08-25&sucursal_id=all"
        res = await client.get(url, headers=headers)

        print(f"\nREQUEST URL: {url}")
        print(f"HTTP STATUS: {res.status_code}")

        if res.status_code == 200:
            json_data = res.json()
            kpis = json_data["kpis"]
            top_prods = json_data["top_productos"]
            cats = json_data["categorias"]
            trazabilidad = json_data["trazabilidad"]

            print("\n--- RESPONSE JSON REAL ENTREGADO POR LA NUEVA ARQUITECTURA ---")
            print("1. KPIs DE PRODUCTOS:")
            print(f"  - Producto Más Vendido (Volumen): '{kpis['producto_mas_vendido']}' ({kpis['unidades_producto_mas_vendido']} un.)")
            print(f"  - Producto Mayor Recaudación: '{kpis['producto_mayor_recaudacion']}' (Bs. {kpis['ingresos_producto_mayor_recaudacion']:,.2f})")
            print(f"  - SKUs Distintos Vendidos: {kpis['skus_distintos']}")
            print(f"  - Unidades Promedio por Ticket: {kpis['unidades_promedio_por_ticket']} un/ticket")

            print("\n2. TOP 5 PRODUCTOS DE MAYOR RECAUDACIÓN:")
            for idx, p in enumerate(top_prods[:5], 1):
                print(f"  {idx}. [{p['categoria_nombre']}] {p['nombre']} | Unid: {p['unidades_vendidas']} | Ingresos: Bs. {p['ingresos_bs']:,.2f} | P. Prom: Bs. {p['precio_promedio_efectivo']:,.2f} | Part: {p['participacion_pct']}%")

            print("\n3. DESGLOSE POR CATEGORÍAS:")
            sum_cat_pct = sum(c["participacion_pct"] for c in cats)
            for c in cats:
                print(f"  - {c['categoria_nombre']}: Bs. {c['ingresos_bs']:,.2f} ({c['unidades_vendidas']} un) | Part: {c['participacion_pct']}%")

            print("\n" + "=" * 90)
            print("EVALUACIÓN DE LAS 6 VALIDACIONES DE CONCILIACIÓN MATEMÁTICA")
            print("=" * 90)

            val_a = trazabilidad.get("total_tickets_procesados") == 67
            print(f"  [VALIDACIÓN A] Tickets Distintos Procesados: {trazabilidad.get('total_tickets_procesados')} == 67 -> {'✓ PASÓ' if val_a else '❌ FALLÓ'}")

            val_b = round(trazabilidad.get("suma_subtotales_items"), 2) == 2653.00
            print(f"  [VALIDACIÓN B] Conciliación Suma Subtotales: Bs. {trazabilidad.get('suma_subtotales_items'):,.2f} == Bs. 2,653.00 -> {'✓ PASÓ' if val_b else '❌ FALLÓ'}")

            val_c = kpis["skus_distintos"] == 57
            print(f"  [VALIDACIÓN C] Conteo SKUs Únicos: {kpis['skus_distintos']} == 57 -> {'✓ PASÓ' if val_c else '❌ FALLÓ'}")

            val_d = trazabilidad.get("total_lineas_items") == 94
            print(f"  [VALIDACIÓN D] Líneas de Ítems: {trazabilidad.get('total_lineas_items')} == 94 -> {'✓ PASÓ' if val_d else '❌ FALLÓ'}")

            val_e = abs(sum_cat_pct - 100.0) < 1.0
            print(f"  [VALIDACIÓN E] Suma de Participación por Categorías: {sum_cat_pct:.2f}% (~100%) -> {'✓ PASÓ' if val_e else '❌ FALLÓ'}")

            empty_url = "/api/v1/bi-productos/productos?start_date=2026-09-01&end_date=2026-09-01&sucursal_id=all"
            res_empty = await client.get(empty_url, headers=headers)
            val_f = res_empty.status_code == 200 and res_empty.json()["kpis"]["skus_distintos"] == 0
            print(f"  [VALIDACIÓN F] Respuesta HTTP 200 Vacía sin Mocks: {'✓ PASÓ' if val_f else '❌ FALLÓ'}")

            if val_a and val_b and val_c and val_d and val_e and val_f:
                print("\n✓ RESULTADO FINAL: RECONSTRUCCIÓN LIMPIA APROBADA CON ÉXITO CÓDIGO 0 (100% TRAZABLE)")
            else:
                print("\n❌ RESULTADO FINAL: Falló al menos una validación.")

        else:
            print(f"❌ Error HTTP {res.status_code}: {res.text}")

if __name__ == "__main__":
    asyncio.run(run_clean_bi_productos_http_test())
