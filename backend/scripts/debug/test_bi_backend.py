import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi.testclient import TestClient

from app.main import app
from app.infrastructure.db import init_db
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)

async def run_tests():
    print("=" * 60)
    print("AUDITORÍA Y DIAGNÓSTICO DE ENDPOINTS BI BACKEND")
    print("=" * 60)

    print("Inicializando conexión a base de datos MongoDB...")
    try:
        await init_db()
        print("✓ Base de datos MongoDB inicializada.")
    except Exception as e:
        print(f"⚠️ Advertencia inicializando BD (entorno offline): {e}")

    with TestClient(app) as client:
        # 1. Test Health Global
        res_health = client.get("/health")
        print(f"GET /health -> status: {res_health.status_code}, body: {res_health.json()}")

        # 2. Test BI Health
        res_bi_health = client.get("/api/v1/bi/health")
        print(f"GET /api/v1/bi/health -> status: {res_bi_health.status_code}, body: {res_bi_health.json()}")
        assert res_bi_health.status_code == 200, f"Expected 200, got {res_bi_health.status_code}"

    print("\n✓ Auditoría de endpoints FastAPI completada con éxito.")

if __name__ == "__main__":
    asyncio.run(run_tests())
