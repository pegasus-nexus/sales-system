import httpx
import asyncio

async def test_render_auth():
    base_url = "https://sales-system-aptb.onrender.com/api/v1"
    async with httpx.AsyncClient() as client:
        login_res = await client.post(
            f"{base_url}/token",
            data={"username": "superadmin", "password": "SuperAdminPassword123!"}
        )
        print("Login status:", login_res.status_code, login_res.text[:200])
        
        if login_res.status_code == 200:
            token = login_res.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            dash_res = await client.get(
                f"{base_url}/analytics/dashboard-v3?start_date=2026-08-20T00:00:00.000Z&end_date=2026-08-20T23:59:59.000Z",
                headers=headers
            )
            print("Dashboard V3 Status:", dash_res.status_code)
            print("Response:", dash_res.json() if dash_res.status_code == 200 else dash_res.text)

asyncio.run(test_render_auth())
