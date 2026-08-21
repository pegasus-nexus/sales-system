import httpx
import asyncio

async def test_render_v3():
    url = "https://sales-system-aptb.onrender.com/api/v1/analytics/dashboard-v3?start_date=2026-08-20T00:00:00.000Z&end_date=2026-08-20T23:59:59.000Z"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=10.0)
            print(f"Status Code: {resp.status_code}")
            print(f"Response: {resp.text[:300]}")
        except Exception as e:
            print(f"Error: {e}")

asyncio.run(test_render_v3())
