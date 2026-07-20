import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    uri = "mongodb+srv://sahian-dev-mongo:8wngkGRxGBKg3gsu@sales-system.hh277gd.mongodb.net/?appName=sales-system"
    db = AsyncIOMotorClient(uri)['salessystem']
    
    max_doc = await db.ventas_historicas_crudas.find_one({}, sort=[("fecha_transaccion", -1)])
    if max_doc:
        print(f"La fecha ms reciente en el historial es: {max_doc.get('fecha_transaccion')}")

asyncio.run(main())
