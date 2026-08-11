import asyncio
import sys
import os
import httpx

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.infrastructure.auth import create_access_token

async def test_live_render():
    # Creamos un JWT válido usando el JWT_SECRET_KEY del proyecto
    token = create_access_token(data={"sub": "taboada.heroinas@gmail.com"})
    
    headers = {"Authorization": f"Bearer {token}"}
    base_url = "https://sales-system-aptb.onrender.com/api/v1"
    
    print("==========================================================================")
    print("PRUEBA DE PETICIONES HTTP DIRECTAS A RENDER BACKEND DE PRODUCCIÓN:")
    print("==========================================================================")
    print(f"Token JWT generado para: taboada@gmail.com")

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Peticion A: HOY 11/08/2026
        url_today = f"{base_url}/analytics/hourly-multiyear?fecha_referencia=2026-08-11"
        resp_today = await client.get(url_today, headers=headers)
        print(f"\n1. GET {url_today}")
        print(f"   HTTP Status Code: {resp_today.status_code}")
        if resp_today.status_code == 200:
            data = resp_today.json()
            meta = data.get("meta", {})
            horas = data.get("horas", [])
            print(f"   • meta.total_real: Bs. {meta.get('total_real')}")
            print(f"   • meta.docs_real:  {meta.get('docs_real')}")
            print(f"   • meta.hora_pico:   {meta.get('hora_pico')}")
            print("   • Desglose de horas devuelto por Render Live API:")
            for h in horas:
                if h['real'] > 0 or h['anio1'] > 0 or h['hora'] in ['08:00', '09:00', '13:00']:
                    print(f"       Hora {h['hora']} -> Real 2026: Bs. {h['real']:>7.2f} | 2025: Bs. {h['anio1']:>7.2f}")
        else:
            print(f"   Error Response: {resp_today.text}")

        # Peticion B: AYER 10/08/2026
        url_yest = f"{base_url}/analytics/hourly-multiyear?fecha_referencia=2026-08-10"
        resp_yest = await client.get(url_yest, headers=headers)
        print(f"\n2. GET {url_yest}")
        print(f"   HTTP Status Code: {resp_yest.status_code}")
        if resp_yest.status_code == 200:
            data_yest = resp_yest.json()
            meta_yest = data_yest.get("meta", {})
            horas_yest = data_yest.get("horas", [])
            print(f"   • meta.total_real: Bs. {meta_yest.get('total_real')}")
            print(f"   • meta.docs_real:  {meta_yest.get('docs_real')}")
            print("   • Desglose de horas 10/08/2026 devuelto por Render Live API:")
            for h in horas_yest:
                if h['real'] > 0:
                    print(f"       Hora {h['hora']} -> Real 2026: Bs. {h['real']:>7.2f}")

if __name__ == '__main__':
    asyncio.run(test_live_render())
