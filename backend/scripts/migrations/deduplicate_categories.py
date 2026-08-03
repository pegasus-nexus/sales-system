import asyncio
from dotenv import load_dotenv
import os
load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.domain.models.category import Category
from app.domain.models.product import Product
from app.domain.models.web_collection import WebCollection
from app.infrastructure.core.config import settings

async def deduplicate():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    await init_beanie(database=db, document_models=[Category, Product, WebCollection])

    print("=== STARTING CATEGORY DEDUPLICATION ===")
    all_cats = await Category.find_all().to_list()
    
    # Group by tenant_id and normalized name
    tenant_cat_groups = {}
    for cat in all_cats:
        key = (cat.tenant_id, cat.name.strip().lower())
        tenant_cat_groups.setdefault(key, []).append(cat)

    merged_count = 0
    deleted_cats_count = 0
    relinked_products_count = 0

    for (tenant_id, cat_name), cat_docs in tenant_cat_groups.items():
        if len(cat_docs) <= 1:
            continue

        print(f"\nFound {len(cat_docs)} duplicate categories for tenant '{tenant_id}' with name '{cat_name}':")
        
        # Determine canonical category (the one with most linked products, or first)
        counts_and_docs = []
        for c in cat_docs:
            count = await Product.find(Product.categoria_id == str(c.id)).count()
            counts_and_docs.append((count, c))
        
        # Sort descending by product count
        counts_and_docs.sort(key=lambda x: x[0], reverse=True)
        canonical = counts_and_docs[0][1]
        secondaries = [c for _, c in counts_and_docs[1:]]

        print(f"  -> Canonical Category ID: {canonical.id} (Name: '{canonical.name}', Linked Products: {counts_and_docs[0][0]})")

        for _, sec in counts_and_docs[1:]:
            sec_id = str(sec.id)
            print(f"  -> Merging secondary Category ID: {sec_id} into {canonical.id}...")

            # Relink products
            prods_to_update = await Product.find(Product.categoria_id == sec_id).to_list()
            if prods_to_update:
                res = await db["products"].update_many(
                    {"categoria_id": sec_id},
                    {"$set": {"categoria_id": str(canonical.id)}}
                )
                relinked_products_count += res.modified_count
                print(f"     Relinked {res.modified_count} products.")

            # Update WebCollections
            web_cols = await WebCollection.find(WebCollection.tenant_id == tenant_id).to_list()
            for wc in web_cols:
                if wc.categories_ids and sec_id in wc.categories_ids:
                    new_ids = [str(canonical.id) if cid == sec_id else cid for cid in wc.categories_ids]
                    # Deduplicate in array
                    new_ids = list(dict.fromkeys(new_ids))
                    wc.categories_ids = new_ids
                    await wc.save()
                    print(f"     Updated WebCollection '{wc.name}' categories_ids.")

            # Delete secondary category
            await sec.delete()
            deleted_cats_count += 1

        merged_count += 1

    print("\n=== DEDUPLICATION COMPLETE ===")
    print(f"Categories Merged: {merged_count}")
    print(f"Duplicate Category Docs Deleted: {deleted_cats_count}")
    print(f"Products Relinked: {relinked_products_count}")

if __name__ == "__main__":
    asyncio.run(deduplicate())
