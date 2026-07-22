import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import datetime

async def main():
    uri = "mongodb+srv://sahian-dev-mongo:8wngkGRxGBKg3gsu@sales-system.hh277gd.mongodb.net/?appName=sales-system"
    db = AsyncIOMotorClient(uri)['salessystem']
    
    start = datetime.datetime(2024, 1, 1, 0, 0, 0)
    end = datetime.datetime(2024, 12, 31, 23, 59, 59)
    
    # Heroínas count in 2024
    count_hero = await db.ventas_historicas_crudas.count_documents({
        "sucursal": {"$regex": "Hero[íi]nas", "$options": "i"},
        "fecha_transaccion": {"$gte": start, "$lte": end}
    })
    print(f"Total registros Heroínas 2024: {count_hero}")
    
    # Recoleta count in 2024
    count_reco = await db.ventas_historicas_crudas.count_documents({
        "sucursal": {"$regex": "Recoleta", "$options": "i"},
        "fecha_transaccion": {"$gte": start, "$lte": end}
    })
    print(f"Total registros Recoleta 2024: {count_reco}")
    
    # Calacoto count in 2024
    count_cala = await db.ventas_historicas_crudas.count_documents({
        "sucursal": {"$regex": "Calacoto", "$options": "i"},
        "fecha_transaccion": {"$gte": start, "$lte": end}
    })
    print(f"Total registros Calacoto 2024: {count_cala}")

asyncio.run(main())
