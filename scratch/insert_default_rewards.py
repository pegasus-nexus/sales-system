import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

MONGODB_URL = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"
TENANT_ID = "69cd7f0a8f3f6866d4cfbb62"

async def main():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    
    default_rewards = [
        { "id": "trufa", "title": "Chocolate Amargo", "tag": "Regalo VIP", "desc": "Pieza maestra de cacao belga.", "img": "/img/chocolate_amargo_beneficio.webp", "validity": "2 Semanas", "is_active": True },
        { "id": "choco", "title": "Trufas de Chocolate", "tag": "Exclusivo", "desc": "70% cacao amazónico.", "img": "/img/trufas_beneficio.webp", "validity": "2 Semanas", "is_active": True },
        { "id": "cupon2", "title": "Gesto 2%", "tag": "Cortesía", "desc": "Descuento especial de bienvenida.", "img": "/img/descuento_porcentaje.webp", "validity": "Un mes", "is_active": True },
        { "id": "choco3", "title": "Gesto 3%", "tag": "Exclusivo", "desc": "70% cacao amazónico en tu compra.", "img": "/img/descuento_porcentaje.webp", "validity": "2 Semanas", "is_active": True },
        { "id": "cupon4", "title": "Gesto 4%", "tag": "Cortesía", "desc": "Descuento especial por compras.", "img": "/img/descuento_porcentaje.webp", "validity": "1 Semana", "is_active": True }
    ]
    
    await db.web_config.update_one(
        {"tenant_id": TENANT_ID},
        {"$set": {"rewards": default_rewards, "updated_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    print("Premios por defecto insertados con exito")

asyncio.run(main())
