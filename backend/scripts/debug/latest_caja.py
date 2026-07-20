import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

NEW_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = "sales_system_prod"

async def main():
    try:
        client = AsyncIOMotorClient(NEW_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        print("Fetching latest 5 sessions...")
        cursor = db["caja_sesiones"].find({}).sort("fecha_apertura", -1).limit(10)
        sessions = await cursor.to_list(length=10)
        
        for s in sessions:
            print(f"- ID: {s.get('_id')}")
            print(f"  Estado: {s.get('estado')}")
            print(f"  Apertura: {s.get('fecha_apertura')}")
            print(f"  Cierre: {s.get('fecha_cierre')}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
