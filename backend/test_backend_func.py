import asyncio
import sys
import os
import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.infrastructure.db import init_db
from app.services.hourly_multiyear_service import get_hourly_multiyear

async def test():
    await init_db()
    res = await get_hourly_multiyear("69cd7f0a8f3f6866d4cfbb62", datetime.date(2026, 8, 11))
    
    print("HOURS from backend service:")
    for h in res['horas']:
        if h['real'] > 0:
            print(f"Hora {h['hora']} -> {h['real']}")

if __name__ == '__main__':
    asyncio.run(test())
