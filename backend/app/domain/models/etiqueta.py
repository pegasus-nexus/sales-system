from typing import Optional
from beanie import Document
from pydantic import Field
from datetime import datetime, timezone

from app.domain.models.base import SoftDeleteMixin


class Etiqueta(Document, SoftDeleteMixin):
    """
    Tags that can be attached to Orders (Pedidos Internos) for better categorization.
    Soft-delete via SoftDeleteMixin: sets is_active=False, deleted_at, deleted_by.
    """
    tenant_id: str
    nombre: str
    color: str = "bg-gray-100 text-gray-700"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "etiquetas"
        indexes = [
            "tenant_id",
            "is_active"
        ]
