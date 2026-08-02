import asyncio
from app.db import init_db
from app.domain.models.user import User

async def main():
    await init_db()
    users = await User.find_all().to_list()
    for u in users:
        print(f"Email: {u.email}, Role: {u.role}, Tenant: {u.tenant_id}")

if __name__ == "__main__":
    asyncio.run(main())
