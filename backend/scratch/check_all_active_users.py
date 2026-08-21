import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def main():
    await init_db()
    db = await get_raw_db()

    users = await db.users.find({}).to_list(100)
    print("=== USUARIOS Y SUS TENANT_IDs EN MONGODB ===")
    for u in users:
        print(f"  User: {u.get('username') or u.get('email')} | Role: {u.get('role')} | tenant_id: {u.get('tenant_id')} (type: {type(u.get('tenant_id'))})")

asyncio.run(main())
