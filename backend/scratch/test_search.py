import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.domain.models.sale import Sale
from core.config import settings

async def test_search():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.MONGODB_DB_NAME], document_models=[Sale])
    
    q = "2D5990"
    safe_q = "2D5990" # already safe
    
    query = {"$or": [
        { "$expr": { "$regexMatch": { "input": { "$toString": "$_id" }, "regex": safe_q, "options": "i" } } },
        { "cashier_name": {"$regex": safe_q, "$options": "i"} },
        { "cliente.razon_social": {"$regex": safe_q, "$options": "i"} },
        { "cliente.nit": {"$regex": safe_q, "$options": "i"} }
    ]}
    
    sales = await Sale.find(query).to_list()
    print(f"Found {len(sales)} sales matching {q}")
    for s in sales:
        print(f"ID: {s.id}")

if __name__ == "__main__":
    asyncio.run(test_search())
