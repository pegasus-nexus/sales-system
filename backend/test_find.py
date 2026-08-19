import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import datetime

async def find_day():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    from app.services.hourly_multiyear_service import get_hourly_multiyear
    
    for i in range(1, 10):
        target_date = datetime.date(2026, 8, 18) - datetime.timedelta(days=i)
        res = await get_hourly_multiyear("69cd7f0a8f3f6866d4cfbb62", target_date)
        total = res['meta']['total_real']
        if abs(total - 3849.50) < 10:
            print(f"Found matching day: {target_date} with total {total}")
            for h in res['horas']:
                if h['real'] > 0:
                    print(f"Hora {h['hora']} -> Real: {h['real']}")
            return
            
    print("Not found in the last 10 days")

if __name__ == '__main__':
    asyncio.run(find_day())
