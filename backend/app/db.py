from app.infrastructure.db import init_db, get_client
from app.infrastructure.core.config import settings

async def get_raw_db():
    client = get_client()
    return client[settings.MONGODB_DB_NAME]
