import asyncio
from dotenv import load_dotenv
import os
load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.domain.models.category import Category
from app.domain.models.product import Product
from app.infrastructure.core.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    await init_beanie(database=db, document_models=[Category, Product])

    print("=== CATEGORIES ===")
    cats = await Category.find_all().to_list()
    for c in cats:
        prods = await Product.find(Product.categoria_id == str(c.id)).to_list()
        print(f"ID: {c.id} | Name: '{c.name}' | Tenant: {c.tenant_id} | Product count by ID: {len(prods)}")

    print("\n=== PRODUCTS DETAILED ===")
    prods = await Product.find(Product.tenant_id == "69cd7f0a8f3f6866d4cfbb62").to_list()
    for p in prods:
        print(f"Prod: '{p.descripcion}' | cat_id: {p.categoria_id}")

if __name__ == "__main__":
    asyncio.run(main())
