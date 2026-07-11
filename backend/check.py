import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb+srv://rodrigorayomartinez_db_user:RqunkSiTBxQU2oew@cluster0.teutv4o.mongodb.net/?appName=Cluster0"

async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["salessystem"]
    log_col = db["inventory_logs"]
    
    logs = await log_col.find({"tipo_movimiento": "ENTRADA_MANUAL", "referencia_id": "INIT_STOCK"}).limit(1).to_list(None)
    for log in logs:
        print(log)

if __name__ == "__main__":
    asyncio.run(main())
