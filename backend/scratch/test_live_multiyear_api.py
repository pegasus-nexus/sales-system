import httpx
import asyncio

async def test_live_api(date_str: str):
    base_url = "https://sales-system-aptb.onrender.com/api/v1"
    async with httpx.AsyncClient() as client:
        # Get token
        login_res = await client.post(
            f"{base_url}/token",
            data={"username": "admin.general.taboada@taboada.bo", "password": "SuperAdminPassword123!"}
        )
        if login_res.status_code != 200:
            login_res = await client.post(
                f"{base_url}/token",
                data={"username": "superadmin@sales.com", "password": "SuperAdminPassword123!"}
            )

        if login_res.status_code != 200:
            print("Login failed:", login_res.status_code, login_res.text)
            return

        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        url = f"{base_url}/analytics/hourly-multiyear?fecha_referencia={date_str}&sucursal=all"
        res = await client.get(url, headers=headers, timeout=15.0)

        print(f"\n--- RESPUESTA LIVE RENDER PARA {date_str} ---")
        print("Status:", res.status_code)
        if res.status_code == 200:
            data = res.json()
            meta = data.get("meta", {})
            horas = data.get("horas", [])
            print(f"Total 2026: Bs. {meta.get('total_real')}")
            print(f"Total 2025: Bs. {meta.get('total_a1')}")
            print(f"Total 2024: Bs. {meta.get('total_a2')}")
            print(f"Hora Pico:  {meta.get('hora_pico')} (Bs. {meta.get('venta_pico_maxima')})")
            print("Muestra 5 primeras horas no nulas:")
            for h in horas:
                if h["real"] > 0 or h["anio1"] > 0 or h["anio2"] > 0:
                    print(f"  {h['hora']} -> 2026: Bs. {h['real']} | 2025: Bs. {h['anio1']} | 2024: Bs. {h['anio2']}")

async def main():
    await test_live_api("2026-08-19")
    await test_live_api("2026-08-20")

asyncio.run(main())
