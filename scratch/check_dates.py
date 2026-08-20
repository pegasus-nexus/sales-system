import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def check_dates():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    tenant = '69cd7f0a8f3f6866d4cfbb62'
    
    start = datetime(2026, 7, 20)
    end = datetime(2026, 8, 19)
    
    cierres = await db.caja_sesiones.find({
        'tenant_id': tenant,
        'created_at': {'$gte': start, '$lte': end}
    }).to_list(None)
    
    gastos = await db.caja_movimientos.find({
        'tenant_id': tenant, 
        'tipo': 'EGRESO',
        'created_at': {'$gte': start, '$lte': end}
    }).to_list(None)
    
    print(f"Cierres recientes (20 Jul - 19 Ago): {len(cierres)}")
    print(f"Gastos recientes (20 Jul - 19 Ago): {len(gastos)}")

if __name__ == '__main__':
    asyncio.run(check_dates())
