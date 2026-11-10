import os
import pytest_asyncio
from app.infrastructure.core.config import settings
from app.infrastructure.db import init_db

# Solo conectar a base de datos si TEST_MONGO_URI está explícitamente configurada (ej. en CI con un contenedor de MongoDB)
test_db_url = os.getenv("TEST_MONGO_URI")


@pytest_asyncio.fixture(scope="session", autouse=True)
async def initialize_test_database():
    """
    Se ejecuta una sola vez al inicio de la sesión de pruebas.
    Inicializa los modelos de Beanie si TEST_MONGO_URI está configurada.
    En entornos locales sin Mongo corriendo, permite ejecutar pruebas puras de modelos y lógica rápidamente.
    """
    if test_db_url:
        try:
            settings.MONGODB_URL = test_db_url
            settings.MONGODB_DB_NAME = "sales_system_test_suite"
            await init_db()
        except Exception:
            # Si MongoDB no está corriendo, se continúa
            pass
    yield
