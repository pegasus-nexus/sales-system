import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    tenant = '69cd7f0a8f3f6866d4cfbb62'
    
    cierres = await db.caja_sesiones.find({'tenant_id': tenant}).to_list(None)
    gastos = await db.caja_movimientos.find({'tenant_id': tenant, 'tipo': 'EGRESO'}).to_list(None)
    
    print(f"Cierres en DB (Chocolates Taboada): {len(cierres)}")
    print(f"Gastos en DB (Chocolates Taboada): {len(gastos)}")

if __name__ == '__main__':
    asyncio.run(check_db())
