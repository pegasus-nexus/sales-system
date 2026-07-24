import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority")
    db = client["sales_system_prod"]
    
    # Timezone AWARE (what FastAPI creates)
    start_aware = datetime.fromisoformat("2026-06-01T00:00:00.000Z").replace(tzinfo=timezone.utc)
    end_aware = datetime.fromisoformat("2026-06-30T23:59:59.000Z").replace(tzinfo=timezone.utc)
    
    # NAIVE (what test_portfolio used if we omitted tzinfo, wait, I used tzinfo in test_portfolio!)
    # In test_portfolio: start = datetime(2026, 6, 1, tzinfo=timezone.utc) -> THIS IS AWARE!
    # And it worked!
    
    print("Testing with AWARE dates...")
    pipeline_aware = [
        {"$match": {"fecha_transaccion": {"$gte": start_aware, "$lte": end_aware}}},
        {"$limit": 5}
    ]
    cursor = db["ventas_historicas_crudas"].aggregate(pipeline_aware)
    docs = await cursor.to_list(None)
    print(f"AWARE Docs found: {len(docs)}")
    
    print("Testing with NAIVE dates...")
    start_naive = start_aware.replace(tzinfo=None)
    end_naive = end_aware.replace(tzinfo=None)
    pipeline_naive = [
        {"$match": {"fecha_transaccion": {"$gte": start_naive, "$lte": end_naive}}},
        {"$limit": 5}
    ]
    cursor = db["ventas_historicas_crudas"].aggregate(pipeline_naive)
    docs = await cursor.to_list(None)
    print(f"NAIVE Docs found: {len(docs)}")

if __name__ == "__main__":
    asyncio.run(run())
