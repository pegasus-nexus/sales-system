import asyncio
import httpx
import json

async def test_render_authenticated():
    base_url = "https://sales-system-aptb.onrender.com/api/v1"
    login_url = f"{base_url}/token"
    
    print("==========================================================================")
    print("PROBANDO ENDPOINT HTTP REAL EN EL BACKEND DE PRODUCCIÓN RENDER:")
    print("==========================================================================")

    async with httpx.AsyncClient() as client:
        try:
            # Login payload
            login_data = {
                "username": "sucursal.heroinas.taboada@gmail.com",
                "password": "Sucursal.heroinas$2026"
            }
            login_resp = await client.post(
                login_url,
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            print(f"Login Status en Render Live: {login_resp.status_code}")
            
            token = login_resp.json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}

            # Peticion 1: fecha_referencia = 2026-08-11 (Hoy)
            url_today = f"{base_url}/analytics/hourly-multiyear?fecha_referencia=2026-08-11"
            resp_today = await client.get(url_today, headers=headers, timeout=15.0)
            
            print("\n1. PETICIÓN REAL A RENDER LIVE PARA 11/08/2026 (HOY):")
            print(f"   Status Code: {resp_today.status_code}")
            if resp_today.status_code == 200:
                data_today = resp_today.json()
                print(f"   meta: {data_today.get('meta')}")
                print("   horas:")
                for h in data_today.get('horas', []):
                    if h['real'] > 0 or h['anio1'] > 0:
                        print(f"     • Hora {h['hora']} -> 2026: Bs. {h['real']} | 2025: Bs. {h['anio1']}")
            else:
                print(f"   Response Text: {resp_today.text}")

            # Peticion 2: fecha_referencia = 2026-08-10 (Ayer)
            url_yest = f"{base_url}/analytics/hourly-multiyear?fecha_referencia=2026-08-10"
            resp_yest = await client.get(url_yest, headers=headers, timeout=15.0)
            
            print("\n2. PETICIÓN REAL A RENDER LIVE PARA 10/08/2026 (AYER):")
            print(f"   Status Code: {resp_yest.status_code}")
            if resp_yest.status_code == 200:
                data_yest = resp_yest.json()
                print(f"   meta: {data_yest.get('meta')}")
                print("   horas:")
                for h in data_yest.get('horas', []):
                    if h['real'] > 0:
                        print(f"     • Hora {h['hora']} -> 2026: Bs. {h['real']}")

        except Exception as e:
            print(f"Error consultando Render Live Authenticated: {e}")

if __name__ == '__main__':
    asyncio.run(test_render_authenticated())
