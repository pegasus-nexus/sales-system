import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

NEW_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"

async def main():
    try:
        client = AsyncIOMotorClient(NEW_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        start_date = datetime(2026, 7, 16, 0, 0, 0, tzinfo=timezone.utc)
        end_date = datetime(2026, 7, 19, 0, 0, 0, tzinfo=timezone.utc)

        cursor = db["caja_sesiones"].find({
            "abierta_at": {"$gte": start_date, "$lt": end_date}
        }).sort("abierta_at", -1)
        
        sessions = await cursor.to_list(length=100)
        print(f"Found {len(sessions)} sessions between July 16 and July 18 UTC:")
        for s in sessions:
            print(f"- ID: {s.get('_id')} | Sucursal: {s.get('sucursal_id')}")
            print(f"  Estado: {s.get('estado')}")
            print(f"  Abierta: {s.get('abierta_at')}")
            print(f"  Cerrada: {s.get('cerrada_at')}")
            print(f"  Monto Fisico: {s.get('monto_cierre_fisico')}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
