import asyncio
import sys
import os

sys.path.append(os.getcwd())

from app.infrastructure.db import init_db
from app.domain.models.sucursal import Sucursal
from app.domain.models.user import User

async def main():
    await init_db()
    s = await Sucursal.find({"nombre": {"$regex": "Heroinas", "$options": "i"}}).to_list()
    for x in s:
        print("Sucursal:", x.id, x.nombre, x.tenant_id)

    u = await User.find_one({"username": {"$regex": "admin", "$options": "i"}, "tenant_id": "taboada"})
    print("User:", u.id, u.username)

asyncio.run(main())
