import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def main():
    await init_db()
    db = await get_raw_db()
    sucursales = await db.ventas_historicas_crudas.distinct('sucursal')
    print('Sucursales en ventas_historicas_crudas:', sucursales)

asyncio.run(main())
