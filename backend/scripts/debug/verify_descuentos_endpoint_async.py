import asyncio
import json
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db import init_db
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import create_access_token

async def run_clean_bi_descuentos_http_test():
    await init_db()

    print("=" * 90)
    print("RECONSTRUCCIÓN LIMPIA DE EXTREMO A EXTREMO — PRUEBA HTTP REAL FASE 8 (PASO 8)")
    print("NUEVA ARQUITECTURA BI: /api/v1/bi-descuentos/impacto")
    print("=" * 90)

    user = await User.find_one(User.email == "admin.general.taboada@taboada.bo")
    if not user:
        user = await User.find_one(User.role == UserRole.ADMIN_MATRIZ)

    token = create_access_token(data={"sub": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Petición HTTP Real: GET /api/v1/bi-descuentos/impacto
        url = "/api/v1/bi-descuentos/impacto?sucursal_id=all"
        res = await client.get(url, headers=headers)

        print(f"\nREQUEST URL: {url}")
        print(f"HTTP STATUS: {res.status_code}")

        if res.status_code == 200:
            json_data = res.json()
            kpis = json_data["kpis"]
            promos = json_data["promociones"]
            trazabilidad = json_data["trazabilidad"]

            print("\n--- RESPONSE JSON REAL ENTREGADO POR LA NUEVA ARQUITECTURA ---")
            print("1. KPIs DE DESCUENTOS Y PROMOCIONES:")
            print(f"  - Promociones Configuradas: {kpis['promociones_configuradas']}")
            print(f"  - Promociones Activas:      {kpis['promociones_activas']}")
            print(f"  - Tickets con Descuento:    {kpis['tickets_con_descuento']}")
            print(f"  - Monto Total Descuentos:   Bs. {kpis['monto_total_descuentos_otorgados']:,.2f}")
            print(f"  - Promoción Más Usada:     '{kpis['promocion_mas_usada_nombre']}' (Bs. {kpis['promocion_mas_usada_monto']:,.2f})")

            print("\n2. TOP PROMOCIONES Y IMPACTO DIRECTO EN VENTAS:")
            for idx, p in enumerate(promos[:5], 1):
                print(f"  {idx}. [{p['tipo']}] {p['nombre']} (Valor: {p['valor']}) | Tickets: {p['tickets_aplicados']} | Descuento Otorgado: Bs. {p['monto_descuento_total']:,.2f}")

            print("\n" + "=" * 90)
            print("EVALUACIÓN DE LAS VALIDACIONES MATEMÁTICAS EXIGIDAS EN EL PROTOCOLO")
            print("=" * 90)

            val_a = kpis["promociones_configuradas"] == 10
            print(f"  [VALIDACIÓN A] Promociones Configuradas (Tenant Taboada): {kpis['promociones_configuradas']} == 10 -> {'✓ PASÓ' if val_a else '❌ FALLÓ'}")

            val_b = kpis["tickets_con_descuento"] == 2
            print(f"  [VALIDACIÓN B] Tickets con Descuento Registrado: {kpis['tickets_con_descuento']} == 2 -> {'✓ PASÓ' if val_b else '❌ FALLÓ'}")

            val_c = kpis["monto_total_descuentos_otorgados"] == 46.30
            print(f"  [VALIDACIÓN C] Monto Total Descuentos: Bs. {kpis['monto_total_descuentos_otorgados']:,.2f} == Bs. 46.30 -> {'✓ PASÓ' if val_c else '❌ FALLÓ'}")

            sum_desc_promos = round(sum(p["monto_descuento_total"] for p in promos), 2)
            val_d = sum_desc_promos == kpis["monto_total_descuentos_otorgados"]
            print(f"  [VALIDACIÓN D] SUM(monto_descuento_promos) == total_otorgado (Bs. {sum_desc_promos:,.2f} == Bs. {kpis['monto_total_descuentos_otorgados']:,.2f}): {'✓ PASÓ' if val_d else '❌ FALLÓ'}")

            p_calacoto = next((p for p in promos if "calacoto 10%" in p["nombre"].lower()), None)
            val_e = p_calacoto and p_calacoto["monto_descuento_total"] == 39.83 and p_calacoto["tickets_aplicados"] == 1
            print(f"  [VALIDACIÓN E] Promo 'calacoto 10%': Bs. 39.83 / 1 ticket -> {'✓ PASÓ' if val_e else '❌ FALLÓ'}")

            p_diez_unid = next((p for p in promos if "10 unid" in p["nombre"].lower()), None)
            val_f = p_diez_unid and p_diez_unid["monto_descuento_total"] == 6.47 and p_diez_unid["tickets_aplicados"] == 1
            print(f"  [VALIDACIÓN F] Promo 'COMPRA DE 10 UNID': Bs. 6.47 / 1 ticket -> {'✓ PASÓ' if val_f else '❌ FALLÓ'}")

            val_g = trazabilidad.get("roi_efectividad_causal") == "NO_DISPONIBLE (Sin trazabilidad causal de origen de campaña en MongoDB)"
            print(f"  [VALIDACIÓN G] ROI y Efectividad Causal Declaradas Explícitamente NO DISPONIBLES: {'✓ PASÓ' if val_g else '❌ FALLÓ'}")

            if val_a and val_b and val_c and val_d and val_e and val_f and val_g:
                print("\n✓ RESULTADO PASO 8: RECONSTRUCCIÓN LIMPIA FASE 8 APROBADA CON ÉXITO CÓDIGO 0 (100% TRAZABLE)")
            else:
                print("\n❌ RESULTADO PASO 8: Falló al menos una validación.")

        else:
            print(f"❌ Error HTTP {res.status_code}: {res.text}")

if __name__ == "__main__":
    asyncio.run(run_clean_bi_descuentos_http_test())
