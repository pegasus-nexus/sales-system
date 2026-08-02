# -*- coding: utf-8 -*-
"""Buscar credenciales de usuario en MongoDB."""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

async def run():
    client = AsyncIOMotorClient(
        "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority"
    )
    db = client["sales_system_prod"]
    users = await db.users.find({"is_active": True}).limit(10).to_list(10)
    for u in users:
        print(f"email: {u.get('email')}  role: {u.get('role')}  tenant: {u.get('tenant_id')}")
    client.close()

asyncio.run(run())
