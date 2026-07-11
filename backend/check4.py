import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb+srv://rodrigorayomartinez_db_user:RqunkSiTBxQU2oew@cluster0.teutv4o.mongodb.net/?appName=Cluster0"

async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["salessystem"]
    log_col = db["inventory_logs"]
    prod_col = db["products"]
    
    # case insensitive search
    prods = await prod_col.find({"descripcion": {"$regex": "TABLETA DE CHOC. C/MANÍ 50", "$options": "i"}}).to_list(None)
    for prod in prods:
        logs = await log_col.find({"producto_id": str(prod['_id'])}).sort("created_at", 1).to_list(None)
        for l in logs:
            if l.get("created_at").year == 2026 and l.get("created_at").month == 6:
                print(f"Log: {l.get('tipo_movimiento')} - sucursal: {l.get('sucursal_id')} - cant: {l.get('cantidad_movida')} - created_at: {l.get('created_at')}")

if __name__ == "__main__":
    asyncio.run(main())
