import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb+srv://rodrigorayomartinez_db_user:RqunkSiTBxQU2oew@cluster0.teutv4o.mongodb.net/?appName=Cluster0"

async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["salessystem"]
    log_col = db["inventory_logs"]
    prod_col = db["products"]
    
    print("Fixing descriptions...")
    count = 0
    # Find all logs with "Producto Desconocido" and "INIT_STOCK"
    logs = await log_col.find({"descripcion": "Producto Desconocido", "referencia_id": "INIT_STOCK"}).to_list(None)
    print(f"Found {len(logs)} logs to fix.")
    
    for l in logs:
        prod_id = l.get("producto_id")
        if prod_id:
            from bson import ObjectId
            prod = await prod_col.find_one({"_id": ObjectId(prod_id)})
            if prod and prod.get("descripcion"):
                new_desc = prod.get("descripcion")
                await log_col.update_one(
                    {"_id": l["_id"]},
                    {"$set": {"descripcion": new_desc}}
                )
                count += 1
                if count % 100 == 0:
                    print(f"Updated {count} logs...")
            else:
                # If product not found by ObjectId, maybe it's string id?
                prod_str = await prod_col.find_one({"_id": prod_id})
                if prod_str and prod_str.get("descripcion"):
                    new_desc = prod_str.get("descripcion")
                    await log_col.update_one(
                        {"_id": l["_id"]},
                        {"$set": {"descripcion": new_desc}}
                    )
                    count += 1
                    if count % 100 == 0:
                        print(f"Updated {count} logs...")
                        
    print(f"Done. Fixed {count} records.")

if __name__ == "__main__":
    asyncio.run(main())
