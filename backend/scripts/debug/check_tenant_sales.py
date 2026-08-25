import asyncio
from datetime import datetime, time
from zoneinfo import ZoneInfo
from app.db import get_raw_db, init_db
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)

async def check_tenant_sales():
    await init_db()
    db = await get_raw_db()

    # Buscar ventas del 24 de agosto de 2026
    start_utc = datetime(2026, 8, 24, 4, 0, 0, tzinfo=ZoneInfo("UTC"))
    end_utc = datetime(2026, 8, 25, 3, 59, 59, tzinfo=ZoneInfo("UTC"))

    cursor = db.sales.find({"created_at": {"$gte": start_utc, "$lte": end_utc}, "anulada": {"$ne": True}})
    docs = await cursor.to_list(length=None)

    print(f"Total ventas encontradas entre {start_utc} y {end_utc}: {len(docs)}")

    tenant_counts = {}
    for d in docs:
        t_id = str(d.get("tenant_id"))
        tenant_counts[t_id] = tenant_counts.get(t_id, 0) + 1

    print("\nDesglose de tenant_id en ventas de HOY:")
    for t, c in tenant_counts.items():
        print(f"  tenant_id: '{t}' -> {c} ventas")

    # Ver también los usuarios y tenants existentes en la base de datos
    users = await db.users.find({}, {"email": 1, "tenant_id": 1, "role": 1}).to_list(None)
    print("\nUsuarios en la base de datos:")
    for u in users:
        print(f"  email: {u.get('email')} | tenant_id: {u.get('tenant_id')} | role: {u.get('role')}")

if __name__ == "__main__":
    asyncio.run(check_tenant_sales())
