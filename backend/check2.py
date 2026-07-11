import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb+srv://rodrigorayomartinez_db_user:RqunkSiTBxQU2oew@cluster0.teutv4o.mongodb.net/?appName=Cluster0"

async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["salessystem"]
    log_col = db["inventory_logs"]
    prod_col = db["Product"]
    
    # case insensitive search
    prods = await prod_col.find({"descripcion": {"$regex": "TABLETA DE CHOC", "$options": "i"}}).to_list(None)
    print(f"Found {len(prods)} products")
    for prod in prods:
        print(f"Product found: {prod['_id']} - {prod.get('descripcion')}")
        logs = await log_col.find({"producto_id": str(prod['_id'])}).sort("created_at", 1).to_list(None)
        print(f"Found {len(logs)} logs")
        for l in logs:
            print(f"Log: {l.get('tipo_movimiento')} - {l.get('cantidad_movida')} - {l.get('created_at')} - {l.get('referencia_id')}")

if __name__ == "__main__":
    asyncio.run(main())
