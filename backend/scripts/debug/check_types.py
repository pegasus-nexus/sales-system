import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_types():
    c = AsyncIOMotorClient("mongodb://localhost:27017")
    db = c["salessystem"]
    docs = await db.sales.find({}).to_list(length=10)
    for d in docs:
        ca = d.get("created_at")
        print(f"ID: {d.get('_id')} | created_at: {repr(ca)} (tipo: {type(ca)}) | fecha_bolivia: {repr(d.get('fecha_bolivia'))}")

if __name__ == "__main__":
    asyncio.run(check_types())
