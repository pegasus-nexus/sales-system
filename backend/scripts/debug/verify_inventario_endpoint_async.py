import asyncio
import json
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db import init_db
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import create_access_token

async def run_clean_bi_inventario_http_test():
    await init_db()

    print("=" * 90)
    print("RECONSTRUCCIÓN LIMPIA DE EXTREMO A EXTREMO — PRUEBA HTTP REAL FASE 6 (PASO 8)")
    print("NUEVA ARQUITECTURA BI: /api/v1/bi-inventario/control")
    print("=" * 90)

    user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user:
        user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    token = create_access_token(data={"sub": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Petición HTTP Real: GET /api/v1/bi-inventario/control
        url = "/api/v1/bi-inventario/control?sucursal_id=all"
        res = await client.get(url, headers=headers)

        print(f"\nREQUEST URL: {url}")
        print(f"HTTP STATUS: {res.status_code}")

        if res.status_code == 200:
            json_data = res.json()
            kpis = json_data["kpis"]
            sucursales = json_data["desglose_sucursales"]
            top_prods = json_data["top_productos_inventario"]
            trazabilidad = json_data["trazabilidad"]

            print("\n--- RESPONSE JSON REAL ENTREGADO POR LA NUEVA ARQUITECTURA ---")
            print("1. KPIs DE INVENTARIO Y STOCK:")
            print(f"  - Total Unidades Stock: {kpis['total_unidades_stock']:,.2f} un.")
            print(f"  - Valorización Total a Costo: Bs. {kpis['valorizacion_costo_total']:,.2f}")
            print(f"  - SKUs con Stock Positivo (> 0): {kpis['skus_con_stock_disponible']} SKUs")
            print(f"  - SKUs Agotados (<= 0): {kpis['skus_agotados']} SKUs")
            print(f"  - SKUs Stock Bajo (1-5 un.): {kpis['skus_stock_bajo']} SKUs")
            print(f"  - Mayor Inventario: '{kpis['sucursal_mayor_inventario_nombre']}' (Bs. {kpis['sucursal_mayor_inventario_monto']:,.2f})")

            print("\n2. TOP 5 PRODUCTOS DE MAYOR VALORIZACIÓN EN STOCK:")
            for idx, p in enumerate(top_prods[:5], 1):
                print(f"  {idx}. [{p['categoria_nombre']}] {p['nombre']} | Stock: {p['stock_actual']} un | Costo U: Bs. {p['costo_unitario']:,.2f} | Valor Total: Bs. {p['valor_total_costo']:,.2f}")

            print("\n" + "=" * 90)
            print("EVALUACIÓN DE LAS VALIDACIONES MATEMÁTICAS EXIGIDAS EN EL PROTOCOLO")
            print("=" * 90)

            val_a = kpis["total_unidades_stock"] == 11400.00
            print(f"  [VALIDACIÓN A] Total Unidades Stock (Tenant Taboada): {kpis['total_unidades_stock']:,.2f} == 11,400.00 un. -> {'✓ PASÓ' if val_a else '❌ FALLÓ'}")

            val_b = kpis["valorizacion_costo_total"] == 242185.36
            print(f"  [VALIDACIÓN B] Valorización Total a Costo (Tenant Taboada): Bs. {kpis['valorizacion_costo_total']:,.2f} == Bs. 242,185.36 -> {'✓ PASÓ' if val_b else '❌ FALLÓ'}")

            val_c = kpis["skus_con_stock_disponible"] == 241
            print(f"  [VALIDACIÓN C] SKUs con Stock Disponibles: {kpis['skus_con_stock_disponible']} == 241 -> {'✓ PASÓ' if val_c else '❌ FALLÓ'}")

            val_d = kpis["skus_agotados"] == 2446
            print(f"  [VALIDACIÓN D] SKUs Agotados: {kpis['skus_agotados']} == 2446 -> {'✓ PASÓ' if val_d else '❌ FALLÓ'}")

            val_e = kpis["skus_stock_bajo"] == 266
            print(f"  [VALIDACIÓN E] SKUs Stock Bajo (1-5 un.): {kpis['skus_stock_bajo']} == 266 -> {'✓ PASÓ' if val_e else '❌ FALLÓ'}")

            sum_val_prods = round(sum(p["valor_total_costo"] for p in top_prods), 2)
            val_f = sum_val_prods == kpis["valorizacion_costo_total"]
            print(f"  [VALIDACIÓN F] SUM(valor_stock_productos) == valorizacion_costo_total (Bs. {sum_val_prods:,.2f} == Bs. {kpis['valorizacion_costo_total']:,.2f}): {'✓ PASÓ' if val_f else '❌ FALLÓ'}")

            sum_unid_suc = round(sum(s["unidades_stock"] for s in sucursales), 2)
            val_g = sum_unid_suc == kpis["total_unidades_stock"]
            print(f"  [VALIDACIÓN G] SUM(unidades_sucursales) == total_unidades_stock ({sum_unid_suc:,.2f} == {kpis['total_unidades_stock']:,.2f}): {'✓ PASÓ' if val_g else '❌ FALLÓ'}")

            val_h = trazabilidad.get("rotacion_kardex") == "NO_DISPONIBLE (Sin historial continuo de movimientos de almacén en MongoDB)"
            print(f"  [VALIDACIÓN H] Rotación Kardex Declarada Explícitamente NO DISPONIBLE: {'✓ PASÓ' if val_h else '❌ FALLÓ'}")

            if val_a and val_b and val_c and val_d and val_e and val_f and val_g and val_h:
                print("\n✓ RESULTADO PASO 8: RECONSTRUCCIÓN LIMPIA FASE 6 APROBADA CON ÉXITO CÓDIGO 0 (100% TRAZABLE)")
            else:
                print("\n❌ RESULTADO PASO 8: Falló al menos una validación.")

        else:
            print(f"❌ Error HTTP {res.status_code}: {res.text}")

if __name__ == "__main__":
    asyncio.run(run_clean_bi_inventario_http_test())
