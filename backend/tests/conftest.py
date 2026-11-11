import os

import pytest_asyncio

from app.infrastructure.core.config import settings
from app.infrastructure.db import init_db

# En CI (GitHub Actions) MONGO_URI o MONGODB_URL es configurado con el contenedor local: "mongodb://127.0.0.1:27017/..."
test_db_url = (
    os.getenv("MONGO_URI")
    or os.getenv("TEST_MONGO_URI")
    or os.getenv("MONGODB_URL")
    or "mongodb://127.0.0.1:27017/salessystem_test?serverSelectionTimeoutMS=2000"
)

# Protección: si no hay URL o apunta a producción (Atlas con mongodb+srv), usar localhost de pruebas
if "mongodb+srv" in test_db_url:
    test_db_url = (
        "mongodb://127.0.0.1:27017/salessystem_test?serverSelectionTimeoutMS=2000"
    )

os.environ["MONGODB_URL"] = test_db_url
settings.MONGODB_URL = test_db_url
settings.MONGODB_DB_NAME = "salessystem_test"


@pytest_asyncio.fixture(scope="session", autouse=True)
async def initialize_test_database():
    """
    Se ejecuta una sola vez al inicio de la sesión de pruebas.
    Inicializa los modelos de Beanie si MongoDB está disponible (en CI con servicio Mongo activo).
    En entornos locales sin Mongo corriendo, permite continuar para pruebas unitarias.
    """
    is_ci = os.getenv("CI") == "true" or os.getenv("GITHUB_ACTIONS") == "true"
    has_test_mongo = bool(
        is_ci
        or os.getenv("MONGO_URI")
        or os.getenv("TEST_MONGO_URI")
        or (os.getenv("MONGODB_URL") and "127.0.0.1" in os.getenv("MONGODB_URL"))
    )
    if not has_test_mongo:
        yield
        return

    try:
        await init_db()
    except Exception as e:
        # Si MongoDB no está disponible en local, se continúa
        print(f"Aviso: MongoDB no disponible en pruebas: {e}")
    yield
