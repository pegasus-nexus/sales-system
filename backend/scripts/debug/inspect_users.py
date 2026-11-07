import asyncio
from app.infrastructure.db import init_db
from app.domain.models.user import User

async def main():
    await init_db()
    tenant_id = '69cd7f0a8f3f6866d4cfbb62'
    users = await User.find({"tenant_id": tenant_id}).to_list()
    print(f"Usuarios en tenant {tenant_id}: {len(users)}")
    for u in users:
        print(f"  Email: {u.email} | Role: {u.role} | SucursalID: {u.sucursal_id}")

if __name__ == "__main__":
    asyncio.run(main())
