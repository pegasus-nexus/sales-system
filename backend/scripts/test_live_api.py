import asyncio
import httpx

async def test_live_api():
    login_url = "https://sales-system-kappa.vercel.app/api/v1/token"
    login_data = {
        "username": "rodrigo.rayo.martinez@gmail.com",
        "password": "UTwOnrNzBhMeU70i"
    }
    
    print("Logging in...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        res_login = await client.post(login_url, data=login_data)
        if res_login.status_code != 200:
            print(f"Login failed: {res_login.status_code} {res_login.text}")
            return
            
        token = res_login.json()["access_token"]
        portfolio_url = "https://sales-system-kappa.vercel.app/api/v1/analytics/portfolio"
        headers = {"Authorization": f"Bearer {token}"}
        
        import time
        t0 = time.time()
        print("Fetching portfolio data for June...")
        params_june = {
            "start_date": "2026-06-01T00:00:00.000Z",
            "end_date": "2026-06-30T23:59:59.000Z"
        }
        res_june = await client.get(portfolio_url, params=params_june, headers=headers)
        print(f"June took {time.time() - t0:.2f}s")
        if res_june.status_code == 200:
            data = res_june.json()
            print(f"June Products: {len(data.get('products', []))}")
        else:
            print(f"June Failed: {res_june.status_code} {res_june.text}")
            
        print("Fetching portfolio data for July...")
        params_july = {
            "start_date": "2026-07-01T00:00:00.000Z",
            "end_date": "2026-07-31T23:59:59.000Z"
        }
        res_july = await client.get(portfolio_url, params=params_july, headers=headers)
        if res_july.status_code == 200:
            data = res_july.json()
            print(f"July Products: {len(data.get('products', []))}")
        else:
            print(f"July Failed: {res_july.status_code} {res_july.text}")

if __name__ == "__main__":
    asyncio.run(test_live_api())
