import asyncio
import httpx
import json

async def test_render_backend():
    # Login to Render backend to get live bearer token
    login_url = "https://sales-system-aptb.onrender.com/api/v1/auth/login"
    
    print("==========================================================================")
    print("PROBANDO LOGIN Y ENDPOINT /analytics/hourly-multiyear EN RENDER BACKEND LIVE:")
    print("==========================================================================")
    print(f"URL: https://sales-system-aptb.onrender.com/api/v1")

    async with httpx.AsyncClient() as client:
        try:
            # Login payload
            login_data = {
                "username": "admin@pegasus.com",
                "password": "AdminPassword123!" # o credenciales de admin
            }
            # Probemos login con form-data
            login_resp = await client.post(
                login_url,
                data={"username": "admin@pegasus.com", "password": "adminpassword"},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            print(f"Login Status: {login_resp.status_code}")
            token = None
            if login_resp.status_code == 200:
                token = login_resp.json().get("access_token")
                print("Token obtenido con éxito.")
            else:
                print(f"Response: {login_resp.text}")

            # Probemos llamar directamente al endpoint /hourly-multiyear en el Render Backend Live
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            api_url = "https://sales-system-aptb.onrender.com/api/v1/analytics/hourly-multiyear?fecha_referencia=2026-08-11"
            
            resp = await client.get(api_url, headers=headers, timeout=15.0)
            print(f"\nStatus Code en Render Live: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                print("Respuesta de Render Backend en Producción:")
                print(f"  • meta: {data.get('meta')}")
                print(f"  • horas (primeros 5): {data.get('horas')[:5]}")
            else:
                print(f"Respuesta HTTP Error: {resp.text[:500]}")

        except Exception as e:
            print(f"Error consultando Render Live: {e}")

if __name__ == '__main__':
    asyncio.run(test_render_backend())
