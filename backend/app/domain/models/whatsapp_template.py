from datetime import UTC, datetime

from beanie import Document
from pydantic import Field


class WhatsAppTemplate(Document):
    """
    Plantillas dinámicas de mensajes de WhatsApp por Tenant (Odoo Style).
    Soporta variables como {{cliente}}, {{total}}, {{ticket_url}}, {{saldo_pendiente}}, etc.
    """
    tenant_id: str
    nombre: str                                 # Ej: 'Ticket de Venta POS'
    categoria: str = "POS"                      # POS, CREDITOS, PEDIDOS, MARKETING, GENERAL
    mensaje: str                                # Contenido con {{variables}}
    is_default: bool = False                    # Si es la plantilla predeterminada de su categoría
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "whatsapp_templates"
        indexes = [
            "tenant_id",
            "categoria",
            "is_active",
            [("tenant_id", 1), ("categoria", 1)],
        ]
