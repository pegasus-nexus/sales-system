import asyncio
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.auth import create_access_token
from app.infrastructure.db import init_db
from app.main import app
from httpx import ASGITransport

async def main():
    from app.core.config import settings
    print("JWT SECRET KEY:", settings.JWT_SECRET_KEY)
    
    token = create_access_token(data={"sub": "sara.lazarte.ramirez"})
    print(f"Testing LIVE RENDER BACKEND: https://sales-system-aptb.onrender.com/api/v1/products?page=1&limit=1000 ...")
    
    async with httpx.AsyncClient(timeout=30.0) as ac:
        resp = await ac.get(
            "https://sales-system-aptb.onrender.com/api/v1/products?page=1&limit=1000",
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Render Status Code: {resp.status_code}")
        if resp.status_code != 200:
            print("Response:", resp.text)
            return
        data = resp.json()
        items = data.get("items", [])
        print(f"Total items returned from Render: {len(items)}")
        
        for p in items[:15]:
            print(f"  Prod: {p.get('descripcion')} | precio_venta: {p.get('precio_venta')}")

if __name__ == "__main__":
    asyncio.run(main())
