import asyncio
import sys
import os

sys.path.append(os.getcwd())

from app.infrastructure.db import init_db
from app.domain.models.user import User

async def main():
    await init_db()
    users = await User.find({"tenant_id": "taboada.bo"}).to_list()
    for u in users:
        print(u.username, u.role, u.tenant_id)

    users2 = await User.find({"tenant_id": "69cd7f0a8f3f6866d4cfbb62"}).to_list()
    for u in users2:
        print(u.username, u.role, u.tenant_id)

asyncio.run(main())
