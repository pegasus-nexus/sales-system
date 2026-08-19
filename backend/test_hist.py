import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_test():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    doc = await db.ventas_historicas_crudas.find_one({})
    if doc:
        print(f"Fecha transaccion cruda: {doc.get('fecha_transaccion')} (tipo {type(doc.get('fecha_transaccion'))})")

if __name__ == '__main__':
    asyncio.run(get_test())
