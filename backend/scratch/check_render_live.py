import asyncio
import httpx
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def check_live_render_data():
    await init_db()
    db = await get_raw_db()

    # Find a user to log in via API
    user = await db.users.find_one({"role": "ADMIN_MATRIZ"})
    print("User to login:", user.get("username") if user else "None")

    base_url = "https://sales-system-aptb.onrender.com/api/v1"
    async with httpx.AsyncClient() as client:
        # Check health or status
        res = await client.get(f"{base_url}/analytics/hourly-multiyear?fecha_referencia=2026-08-20&clear_cache=true", timeout=10.0)
        print("Status code for unauth:", res.status_code) # Should be 401 Unauthorized if active

asyncio.run(check_live_render_data())
