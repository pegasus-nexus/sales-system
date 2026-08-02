import asyncio
from httpx import AsyncClient

async def main():
    async with AsyncClient() as client:
        res = await client.post("http://localhost:8000/api/v1/auth/login", data={"username": "admin@empresa.com", "password": "password"})
        if res.status_code != 200:
            print(f"Login failed: {res.text}")
            return
        token = res.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        res2 = await client.get("http://localhost:8000/api/v1/reports/sales-matrix?start_date=2026-08-01&end_date=2026-08-02", headers=headers)
        if res2.status_code != 200:
            print(f"Sales matrix failed: {res2.status_code} - {res2.text}")
        else:
            data = res2.json()
            print(f"Sales matrix success! {len(data.get('products', []))} products.")

if __name__ == "__main__":
    asyncio.run(main())
