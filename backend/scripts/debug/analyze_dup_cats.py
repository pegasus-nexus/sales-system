import asyncio
from dotenv import load_dotenv
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

    print("=== ANALYSIS FOR TENANT 69cd7f0a8f3f6866d4cfbb62 ===")
    cats = await Category.find(Category.tenant_id == "69cd7f0a8f3f6866d4cfbb62").to_list()
    
    # Map name -> list of cat docs
    name_map = {}
    for c in cats:
        name_map.setdefault(c.name.strip().lower(), []).append(c)

    for norm_name, cat_list in name_map.items():
        print(f"\nCategory Name Group: '{norm_name}' (Total DB docs with this name: {len(cat_list)})")
        for c in cat_list:
            prods = await Product.find(Product.categoria_id == str(c.id)).to_list()
            print(f"  - Cat ID: {c.id} | Exact Name: '{c.name}' | Products linked: {len(prods)}")

if __name__ == "__main__":
    asyncio.run(main())
