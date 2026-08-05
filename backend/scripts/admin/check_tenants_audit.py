import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db import init_db, get_raw_db

async def check_tenants():
    await init_db()
    db = await get_raw_db()

    # 1. Chequear tenant_ids en 'sales' en 2026-04-03
    sales_tenants = await db.sales.distinct("tenant_id", {"created_at": {"$gte": "2026-04-01"}})
    print("Distinct tenant_id en sales (Abril 2026):", sales_tenants)

    # 2. Chequear todos los usuarios
    users = await db.users.find({}, {"email": 1, "username": 1, "tenant_id": 1, "rol": 1}).to_list(100)
    print("\nUsuarios y sus tenant_id:")
    for u in users:
        print(f"  - User: {u.get('email') or u.get('username')} | tenant_id: '{u.get('tenant_id')}' | rol: {u.get('rol')}")

    # 3. Probemos get_hourly_multiyear con CADA tenant_id encontrado
    from datetime import date
    from app.services.hourly_multiyear_service import get_hourly_multiyear

    for t_id in sales_tenants:
        t_id_str = str(t_id)
        res = await get_hourly_multiyear(t_id_str, date(2026, 4, 3), date(2025, 4, 18), date(2024, 3, 29))
        meta = res.get("meta", {})
        print(f"\nResultado para tenant_id='{t_id_str}':")
        print(f"  Total Real (2026): {meta.get('total_real')}")
        print(f"  Total A1 (2025): {meta.get('total_a1')}")
        print(f"  Total A2 (2024): {meta.get('total_a2')}")

if __name__ == '__main__':
    asyncio.run(check_tenants())
