import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def check_db():
    try:
        from app.infrastructure.core.config import settings
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client["sales_system_prod"]
        
        # Check critical collections
        print("--- CONTEO EN sales_system_prod ---")
        for col in ["products", "category", "web_collection", "inventario"]:
            count = await db[col].count_documents({})
            print(f"Coleccion {col}: {count} documentos")
            
        print("\n--- MUESTRA DE CATEGORIAS ---")
        cats = await db["category"].find().limit(5).to_list(None)
        for c in cats:
            print(c.get("name", "Unnamed"), "Activa:", c.get("is_active", True))
            
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(check_db())
