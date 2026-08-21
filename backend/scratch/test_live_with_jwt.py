import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db
from app.infrastructure.auth import create_access_token

async def main():
    await init_db()
    db = await get_raw_db()

    user = await db.users.find_one({"role": "SUPERADMIN"})
    if not user:
        user = await db.users.find_one({})

    print("User found:", user.get("username"), user.get("email"), user.get("role"), user.get("tenant_id"))
    token = create_access_token(data={"sub": user.get("username") or user.get("email")})
    print("Generated token:", token[:50] + "...")

    # Now test calling live Render endpoint with this valid token!
    import httpx
    url_19 = "https://sales-system-aptb.onrender.com/api/v1/analytics/hourly-multiyear?fecha_referencia=2026-08-19&sucursal=all"
    url_20 = "https://sales-system-aptb.onrender.com/api/v1/analytics/hourly-multiyear?fecha_referencia=2026-08-20&sucursal=all"

    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        r19 = await client.get(url_19, headers=headers, timeout=10.0)
        print("\n--- LIVE RENDER 19/08/2026 ---")
        print("Status:", r19.status_code)
        if r19.status_code == 200:
            print("Meta:", r19.json().get("meta"))

        r20 = await client.get(url_20, headers=headers, timeout=10.0)
        print("\n--- LIVE RENDER 20/08/2026 ---")
        print("Status:", r20.status_code)
        if r20.status_code == 200:
            print("Meta:", r20.json().get("meta"))

asyncio.run(main())
