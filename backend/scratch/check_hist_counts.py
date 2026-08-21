import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.infrastructure.db import init_db
from app.db import get_raw_db

async def main():
    await init_db()
    db = await get_raw_db()
    
    sucursales = ['Heroinas', 'Heroínas', 'Recoleta', 'Calacoto']
    
    for suc in sucursales:
        count = await db.ventas_historicas_crudas.count_documents({"sucursal": {"$regex": suc, "$options": "i"}})
        print(f"Sucursal {suc}: {count} registros")
        
asyncio.run(main())
