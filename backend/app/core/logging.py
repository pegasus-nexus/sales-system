import logging
import json
import sys
from datetime import datetime
from zoneinfo import ZoneInfo
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class StructuredJSONFormatter(logging.Formatter):
    """
    Formateador de logs estructurados en JSON para Observabilidad en Producción.
    Imprime timestamp con zona horaria America/La_Paz, level, tenant_id, correlation_id, endpoint, method, status_code y latency_ms.
    """

    def format(self, record: logging.LogRecord) -> str:
        now_str = datetime.now(BOLIVIA_TZ).isoformat()
        
        log_entry = {
            "timestamp": now_str,
            "level": record.levelname,
            "tenant_id": getattr(record, "tenant_id", "system"),
            "correlation_id": getattr(record, "correlation_id", "none"),
            "endpoint": getattr(record, "endpoint", record.getMessage()),
            "method": getattr(record, "method", "INTERNAL"),
            "status_code": getattr(record, "status_code", 200),
            "latency_ms": getattr(record, "latency_ms", 0.0),
            "message": record.getMessage()
        }

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, ensure_ascii=False)


def setup_structured_logging():
    logger = logging.getLogger("pegasus_bi_observability")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredJSONFormatter())
    logger.addHandler(handler)
    return logger


structured_logger = setup_structured_logging()
