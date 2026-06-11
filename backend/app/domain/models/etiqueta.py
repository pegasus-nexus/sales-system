from typing import Optional
from beanie import Document
from pydantic import Field
from datetime import datetime

class Etiqueta(Document):
    """
    Tags that can be attached to Orders (Pedidos Internos) for better categorization.
    """
    tenant_id: str
    nombre: str
    color: str = "bg-gray-100 text-gray-700"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "etiquetas"
        indexes = [
            "tenant_id",
            "is_active"
        ]
