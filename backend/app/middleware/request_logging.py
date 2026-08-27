import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import structured_logger


class ObservabilityRequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware de Observabilidad y Monitoreo de Latencias (Eje 4).
    1. Reutiliza o genera X-Correlation-ID único (uuid4).
    2. Mide la latencia de procesamiento en milisegundos (latency_ms).
    3. Emite un log estructurado JSON.
    4. Adiciona el header X-Correlation-ID y X-Response-Time-Ms en la respuesta HTTP.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        t0 = time.time()
        
        # 1. Correlation ID handling
        correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        
        # Extracción de tenant_id si viene en headers o query params
        tenant_id = request.headers.get("X-Tenant-ID") or request.query_params.get("tenant_id") or "system"

        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as exc:
            status_code = 500
            latency_ms = round((time.time() - t0) * 1000, 2)
            structured_logger.error(
                f"Error 500 procesando petición en {request.url.path}",
                extra={
                    "tenant_id": tenant_id,
                    "correlation_id": correlation_id,
                    "endpoint": request.url.path,
                    "method": request.method,
                    "status_code": 500,
                    "latency_ms": latency_ms
                },
                exc_info=exc
            )
            raise exc

        latency_ms = round((time.time() - t0) * 1000, 2)

        # Emitir Log JSON
        structured_logger.info(
            f"Petición completada {request.method} {request.url.path}",
            extra={
                "tenant_id": tenant_id,
                "correlation_id": correlation_id,
                "endpoint": request.url.path,
                "method": request.method,
                "status_code": status_code,
                "latency_ms": latency_ms
            }
        )

        # Retornar Headers en la respuesta
        response.headers["X-Correlation-ID"] = correlation_id
        response.headers["X-Response-Time-Ms"] = str(latency_ms)

        return response
