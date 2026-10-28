import os
import pytest
import pytest_asyncio
from app.infrastructure.core.config import settings
from app.infrastructure.db import init_db

# Sobreescribimos la configuración para que Beanie use una DB de prueba
test_db_url = os.getenv("MONGO_URI", settings.MONGODB_URL)
os.environ["MONGODB_URL"] = test_db_url
settings.MONGODB_URL = test_db_url
settings.MONGODB_DB_NAME = "sales_system_test_suite"


@pytest_asyncio.fixture(scope="function", autouse=True)
async def initialize_test_database():
    """
    Se ejecuta automáticamente en cada test.
    Inicializa los modelos de Beanie si MongoDB está disponible.
    En entornos locales sin Mongo corriendo, permite ejecutar pruebas puras de modelos y lógica.
    """
    try:
        await init_db()
    except Exception:
        # Si MongoDB no está corriendo localmente, se continúa (en CI corre el servicio de Mongo)
        pass
    yield
