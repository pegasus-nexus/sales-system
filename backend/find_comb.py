import asyncio
import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.infrastructure.db import init_db
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def find_combination():
    await init_db()
    
    now = datetime.datetime.now()
    
    sucursales = [None, "Heroinas", "Recoleta", "Calacoto"]
    
    for suc in sucursales:
        for i in range(10):
            target = (now - datetime.timedelta(days=i)).date()
            res = await get_hourly_multiyear("69cd7f0a8f3f6866d4cfbb62", target, sucursal=suc)
            a1 = res['meta']['total_a1']
            a2 = res['meta']['total_a2']
            if abs(a1 - 2317.50) < 5 or abs(a2 - 1045.50) < 5:
                print(f"FOUND: Date={target}, Sucursal={suc}, A1={a1}, A2={a2}, Real={res['meta']['total_real']}")
                return

if __name__ == '__main__':
    asyncio.run(find_combination())
