import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    uri = "mongodb+srv://sahian-dev-mongo:8wngkGRxGBKg3gsu@sales-system.hh277gd.mongodb.net/?appName=sales-system"
    db = AsyncIOMotorClient(uri)['salessystem']
    res = await db.ventas_historicas_crudas.distinct('sucursal')
    print('Sucursales en historial (Atlas):', res)

    # Revisemos también una muestra de fecha para mayo
    import datetime
    start = datetime.datetime(2026, 5, 1)
    end = datetime.datetime(2026, 5, 31, 23, 59, 59)
    count = await db.ventas_historicas_crudas.count_documents({"fecha_transaccion": {"$gte": start, "$lte": end}})
    print(f'Total docs en Mayo 2026: {count}')

asyncio.run(main())
