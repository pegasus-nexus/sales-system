from datetime import UTC, datetime

from beanie import Document
from pydantic import Field


class WhatsAppLog(Document):
    """
    Bitácora de auditoría de mensajes enviados por WhatsApp en el sistema.
    """
    tenant_id: str
    telefono: str
    cliente_nombre: str | None = None
    mensaje: str
    origen: str = "MANUAL"                      # POS, CREDITOS, PEDIDOS, MANUAL, SISTEMA
    estado: str = "ENVIADO"                     # ENVIADO, ERROR, PENDIENTE
    error_detalle: str | None = None
    pdf_url: str | None = None
    usuario_id: str
    usuario_nombre: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "whatsapp_logs"
        indexes = [
            "tenant_id",
            "origen",
            "estado",
            "telefono",
            "created_at",
            [("tenant_id", 1), ("created_at", -1)],
        ]
