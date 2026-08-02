import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.core.config import settings
async def f():
    c = AsyncIOMotorClient(settings.MONGODB_URL)
    count = await c[settings.MONGODB_DB_NAME].daily_sales_summaries.count_documents({})
    print(f"Total summaries: {count}")
asyncio.run(f())
