import os

from app.infrastructure.core.config import settings

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
