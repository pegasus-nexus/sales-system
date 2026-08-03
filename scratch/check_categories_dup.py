import asyncio
import os
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
    categories = await Category.find_all().to_list()
    for cat in categories:
        prods_with_cat = await Product.find(Product.categoria_id == str(cat.id)).to_list()
        prods_with_name = await Product.find(Product.categoria == cat.nombre).to_list()
        print(f"Cat ID: {cat.id} | Name: '{cat.nombre}' | Tenant: {cat.tenant_id} | Products (by ID): {len(prods_with_cat)} | Products (by Name): {len(prods_with_name)}")

    print("\n=== PRODUCTS CATEGORY SUMMARY ===")
    products = await Product.find_all().to_list()
    cat_ids_in_prods = set(p.categoria_id for p in products if p.categoria_id)
    cat_names_in_prods = set(p.categoria for p in products if p.categoria)
    print("Unique categoria_id in products:", cat_ids_in_prods)
    print("Unique categoria names in products:", cat_names_in_prods)

if __name__ == "__main__":
    asyncio.run(main())
