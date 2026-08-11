import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db

async def find_users():
    await init_db()
    db = await get_raw_db()
    
    users = await db.users.find({}, {"email": 1, "username": 1, "rol": 1, "tenant_id": 1}).to_list(10)
    print("==========================================================================")
    print("USUARIOS EN BASE DE DATOS MONGODB:")
    print("==========================================================================")
    for u in users:
        print(f"ID: {u['_id']} | Email: {u.get('email')} | Username: {u.get('username')} | Rol: {u.get('rol')} | Tenant: {u.get('tenant_id')}")

if __name__ == '__main__':
    asyncio.run(find_users())
