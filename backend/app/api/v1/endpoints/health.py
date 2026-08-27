import time
from typing import Dict, Any
from zoneinfo import ZoneInfo
from fastapi import APIRouter, HTTPException

from app.core.config import BUSINESS_TIMEZONE
from app.db import get_raw_db

router = APIRouter()
BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


@router.get("/health", response_model=Dict[str, Any])
async def get_bi_health_diagnostics():
    """
    Endpoint de Diagnóstico y Observabilidad Avanzado para el Centro BI (Eje 4).
    Verifica la conectividad real con MongoDB, existencia de índices, timezone y latencia.
    """
    t0 = time.time()
    try:
        db = await get_raw_db()
        # 1. Ping / Lectura Mínima
        await db.command("ping")

        # 2. Diagnóstico de Índices en Colección Sales
        indexes = await db["sales"].list_indexes().to_list(length=None)
        index_names = [idx.get("name") for idx in indexes]
        indexes_ok = "tenant_fecha_opt" in index_names or len(indexes) > 1

        latency_ms = round((time.time() - t0) * 1000, 2)

        return {
            "status": "healthy",
            "timezone": BUSINESS_TIMEZONE,
            "mongodb": "connected",
            "indexes": "ok" if indexes_ok else "warning",
            "latency_ms": latency_ms,
            "build": "90420be",
            "bi_modules": 10
        }
    except Exception as e:
        latency_ms = round((time.time() - t0) * 1000, 2)
        raise HTTPException(
            status_code=500,
            detail={
                "status": "unhealthy",
                "timezone": BUSINESS_TIMEZONE,
                "mongodb": "disconnected",
                "error": str(e),
                "latency_ms": latency_ms
            }
        )
