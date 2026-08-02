# -*- coding: utf-8 -*-
"""Buscar admin del tenant principal."""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

async def run():
    client = AsyncIOMotorClient(
        "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority"
    )
    db = client["sales_system_prod"]
    # Buscar admin o superadmin
    users = await db.users.find({
        "tenant_id": TENANT_ID,
        "role": {"$in": ["ADMIN", "SUPER_ADMIN", "ADMIN_SUCURSAL", "admin", "superadmin"]}
    }).to_list(20)
    print(f"Total con rol admin: {len(users)}")
    for u in users:
        print(f"  email={u.get('email')}  role={u.get('role')}  active={u.get('is_active')}")

    # También buscar todos del tenant para no perderse nada
    print("\nTodos los usuarios del tenant:")
    all_u = await db.users.find({"tenant_id": TENANT_ID}).to_list(50)
    for u in all_u:
        print(f"  email={u.get('email')}  role={u.get('role')}  active={u.get('is_active')}")

    client.close()

asyncio.run(run())
