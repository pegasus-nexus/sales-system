import pytest
import pytest_asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from app.infrastructure.db import init_db
from app.infrastructure.core.config import settings

# Sobreescribimos la configuración para que Beanie use una DB de prueba
test_db_url = os.getenv("MONGO_URI", settings.MONGODB_URL)
os.environ["MONGODB_URL"] = test_db_url
settings.MONGODB_URL = test_db_url
settings.MONGODB_DB_NAME = "sales_system_test_suite"

@pytest_asyncio.fixture(scope="function", autouse=True)
async def initialize_test_database():
    """
    Se ejecuta automáticamente en cada test.
    Inicializa los modelos de Beanie en el event loop actual.
    """
    await init_db()
    yield
