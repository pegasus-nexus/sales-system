import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client["sales_system_prod"]
    cols = ['almacenes', 'recipes', 'proveedores', 'etiquetas', 'cuentas_credito', 'web_config']
    for col in cols:
        count = await db[col].count_documents({})
        print(f"{col}: {count}")

asyncio.run(main())
