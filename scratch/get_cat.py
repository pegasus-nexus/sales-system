import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_cat():
    client = AsyncIOMotorClient('mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority')
    db = client['sales_system_prod']
    tenant_id = '69cd7f0a8f3f6866d4cfbb62'
    
    # Try to find a category like "Varios" or "Nuevos"
    cat = await db.categories.find_one({"tenant_id": tenant_id, "nombre": {"$regex": "Varios|Otros|General", "$options": "i"}})
    if not cat:
        # Create a new one
        print("Creating category 'Nuevos CSV'...")
        from datetime import datetime
        import uuid
        res = await db.categories.insert_one({
            "tenant_id": tenant_id,
            "nombre": "Nuevos CSV",
            "descripcion": "Productos importados desde CSV",
            "is_active": True,
            "created_at": datetime.utcnow()
        })
        cat_id = str(res.inserted_id)
    else:
        cat_id = str(cat["_id"])
    
    print(f"Cat ID: {cat_id}")

if __name__ == '__main__':
    asyncio.run(get_cat())
