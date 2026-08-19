import asyncio
import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.infrastructure.db import init_db

async def get_test():
    await init_db()
    from app.services.hourly_multiyear_service import get_hourly_multiyear
    
    target_date = datetime.date(2026, 8, 18)
    res = await get_hourly_multiyear("69cd7f0a8f3f6866d4cfbb62", target_date)
    
    for h in res['horas']:
        if h['real'] > 0:
            print(f"Hora {h['hora']} -> Real: {h['real']}")
        if h['anio1'] > 0:
            print(f"Hora {h['hora']} -> Anio1: {h['anio1']}")

if __name__ == '__main__':
    asyncio.run(get_test())
