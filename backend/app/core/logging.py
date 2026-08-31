import logging
import json
import sys
from datetime import datetime
from zoneinfo import ZoneInfo
from app.core.config import BUSINESS_TIMEZONE

BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


class ColoredPrettyFormatter(logging.Formatter):
    """
    Formateador de logs para consola con colores.
    """
    def format(self, record: logging.LogRecord) -> str:
        now_str = datetime.now(BOLIVIA_TZ).strftime("%H:%M:%S")
        status_code = getattr(record, "status_code", None)
        method = getattr(record, "method", "SYS")
        endpoint = getattr(record, "endpoint", "")
        latency_ms = getattr(record, "latency_ms", 0.0)
        client_ip = getattr(record, "client_ip", "")
        user_agent = getattr(record, "user_agent", "")
        query = getattr(record, "query", "")
        message = record.getMessage()
        
        # ANSI Colors
        RESET = "\033[0m"
        GREEN = "\033[32m"
        YELLOW = "\033[33m"
        RED = "\033[31m"
        BLUE = "\033[34m"
        CYAN = "\033[36m"
        BOLD = "\033[1m"
        
        if status_code:
            status_color = GREEN if status_code < 400 else (YELLOW if status_code < 500 else RED)
            query_str = f"?{query}" if query else ""
            client_info = f" | {client_ip} | {user_agent}" if client_ip else ""
            return f"{CYAN}[{now_str}]{RESET} {BLUE}{method}{RESET} {endpoint}{query_str} -> {BOLD}{status_color}{status_code}{RESET} ({latency_ms}ms){client_info}"
        else:
            level_color = RED if record.levelno >= 400 else (YELLOW if record.levelno >= 300 else GREEN)
            return f"{CYAN}[{now_str}]{RESET} {level_color}{record.levelname}{RESET}: {message}"


def setup_structured_logging():
    logger = logging.getLogger("pegasus_bi_observability")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(ColoredPrettyFormatter())
    logger.addHandler(handler)
    return logger


structured_logger = setup_structured_logging()
