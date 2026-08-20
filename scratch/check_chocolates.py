import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_chocolates():
    uri = 'mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['sales_system_prod']
    
    print("Buscando 'Chocolates taboada' en TENANTS...")
    tenants = await db.tenants.find({}).to_list(length=None)
    for t in tenants:
        print(f" - ID: {t['_id']}, Nombre: {t.get('name')}")
        
    print("\nBuscando 'Chocolates taboada' en SUCURSALES...")
    sucursales = await db.sucursales.find({}).to_list(length=None)
    for s in sucursales:
        print(f" - ID: {s['_id']}, Nombre: {s.get('nombre')}, Tenant: {s.get('tenant_id')}")

if __name__ == '__main__':
    asyncio.run(check_chocolates())
