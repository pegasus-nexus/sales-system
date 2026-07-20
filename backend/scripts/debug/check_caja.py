import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import bson

NEW_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"

async def main():
    try:
        client = AsyncIOMotorClient(NEW_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        print("Checking caja_sesiones for July 17, 2026...")
        
        # We look at anything in the DB loosely around that date to see what's there
        # Since timestamps might be UTC, July 17 in Bolivia is UTC-4.
        start_date = datetime(2026, 7, 16, 0, 0, 0, tzinfo=timezone.utc)
        end_date = datetime(2026, 7, 19, 0, 0, 0, tzinfo=timezone.utc)

        # Count total
        total = await db["caja_sesiones"].count_documents({})
        print(f"Total sessions in DB: {total}")
        
        cursor = db["caja_sesiones"].find({
            "fecha_apertura": {"$gte": start_date, "$lt": end_date}
        }).sort("fecha_apertura", -1)
        
        sessions = await cursor.to_list(length=100)
        print(f"Found {len(sessions)} sessions between July 16 and July 18 UTC:")
        for s in sessions:
            print(f"- ID: {s.get('_id')}")
            print(f"  Estado: {s.get('estado')}")
            print(f"  Apertura: {s.get('fecha_apertura')}")
            print(f"  Cierre: {s.get('fecha_cierre')}")
            print(f"  Sucursal: {s.get('sucursal_id')}")
            print(f"  Tenant: {s.get('tenant_id')}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
