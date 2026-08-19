import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import datetime

async def get_test():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client.sales_system_prod
    
    count = await db.ventas_historicas_crudas.count_documents({
        "fecha_transaccion": {"$gte": datetime.datetime(2026, 1, 1)}
    })
    print(f"Documentos 2026 en historico: {count}")
    
    if count > 0:
        doc = await db.ventas_historicas_crudas.find_one({
            "fecha_transaccion": {"$gte": datetime.datetime(2026, 1, 1)}
        }, sort=[("fecha_transaccion", 1)])
        print(f"Ejemplo 2026 historico: {doc.get('fecha_transaccion')} - Sucursal: {doc.get('sucursal')}")

if __name__ == '__main__':
    asyncio.run(get_test())
