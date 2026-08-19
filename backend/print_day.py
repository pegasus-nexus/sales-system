import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import datetime

async def print_day():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    from app.services.hourly_multiyear_service import get_hourly_multiyear
    
    target_date = datetime.date(2026, 8, 11)
    res = await get_hourly_multiyear("69cd7f0a8f3f6866d4cfbb62", target_date)
    
    print("HOURS FOR 2026-08-11:")
    for h in res['horas']:
        print(f"Hora {h['hora']} -> Real: {h['real']} | Anio1: {h['anio1']} | Anio2: {h['anio2']}")

if __name__ == '__main__':
    asyncio.run(print_day())
