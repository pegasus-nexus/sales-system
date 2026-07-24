import asyncio
import httpx
from datetime import datetime, timezone

async def test_live_api():
    # Login to get token
    login_url = "https://sales-system-kappa.vercel.app/api/v1/auth/login"
    login_data = {
        "username": "rodrigo.rayo.martinez@gmail.com",
        "password": "UTwOnrNzBhMeU70i"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            print("Logging in...")
            res_login = await client.post(login_url, data=login_data)
            if res_login.status_code != 200:
                print(f"Login failed: {res_login.status_code} {res_login.text}")
                return
                
            token = res_login.json()["access_token"]
            
            print("Fetching portfolio data from LIVE API...")
            portfolio_url = "https://sales-system-kappa.vercel.app/api/v1/analytics/portfolio"
            params = {
                "start_date": "2026-06-01T00:00:00.000Z",
                "end_date": "2026-06-30T23:59:59.000Z"
            }
            headers = {"Authorization": f"Bearer {token}"}
            
            res_port = await client.get(portfolio_url, params=params, headers=headers)
            print(f"Status Code: {res_port.status_code}")
            if res_port.status_code == 200:
                data = res_port.json()
                print(f"Period: {data.get('period')}")
                print(f"Products returned: {len(data.get('products', []))}")
            else:
                print(f"Response: {res_port.text}")
                
        except Exception as e:
            import traceback
            print(f"Exception: {repr(e)}")
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_live_api())
