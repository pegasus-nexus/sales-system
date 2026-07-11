import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import UpdateOne
from bson import ObjectId

MONGO_URI = "mongodb+srv://rodrigorayomartinez_db_user:RqunkSiTBxQU2oew@cluster0.teutv4o.mongodb.net/?appName=Cluster0"

async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["salessystem"]
    log_col = db["inventory_logs"]
    prod_col = db["products"]
    
    print("Fetching products...", flush=True)
    all_prods = await prod_col.find({}).to_list(None)
    prod_map = {str(p["_id"]): p.get("descripcion", "") for p in all_prods}
    print(f"Loaded {len(prod_map)} products.", flush=True)

    print("Fetching logs...", flush=True)
    logs = await log_col.find({"descripcion": "Producto Desconocido", "referencia_id": "INIT_STOCK"}).to_list(None)
    print(f"Found {len(logs)} logs to fix.", flush=True)
    
    operations = []
    for l in logs:
        prod_id = str(l.get("producto_id"))
        new_desc = prod_map.get(prod_id)
        if new_desc:
            operations.append(UpdateOne({"_id": l["_id"]}, {"$set": {"descripcion": new_desc}}))
            
    if operations:
        print(f"Executing {len(operations)} updates in bulk...", flush=True)
        res = await log_col.bulk_write(operations)
        print(f"Bulk write done. Modified: {res.modified_count}", flush=True)
    else:
        print("No operations to execute.", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
