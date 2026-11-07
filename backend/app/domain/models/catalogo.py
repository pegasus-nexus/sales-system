from typing import Optional, List
from datetime import datetime, timezone
from beanie import Document
from pydantic import Field
from pymongo import IndexModel
from .base import SoftDeleteMixin


class CatalogoConfig(Document, SoftDeleteMixin):
    """
    Configuración de identidad de marca y parámetros del micro-catálogo por tenant.
    """
    tenant_id: str
    business_name: str
    slug: str
    description: Optional[str] = None
    primary_color: str = "#4f46e5"
    secondary_color: str = "#06b6d4"
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    whatsapp_number: str = ""
    whatsapp_message_template: Optional[str] = None
    currency_symbol: str = "Bs."
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "catalogo_configs"
        indexes = [
            IndexModel([("slug", 1)], unique=True),
            IndexModel([("tenant_id", 1)], unique=True),
            IndexModel([("is_active", 1)]),
        ]


class CatalogoProducto(Document, SoftDeleteMixin):
    """
    Producto ligero para exhibición en el micro-catálogo digital.
    No requiere almacenes ni control de inventario complejo.
    """
    tenant_id: str
    title: str
    description: Optional[str] = None
    price: float = 0.0
    currency_symbol: str = "Bs."
    images: List[str] = Field(default_factory=list)
    category: str = "General"
    is_available: bool = True
    is_featured: bool = False
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "catalogo_productos"
        indexes = [
            IndexModel([("tenant_id", 1), ("is_available", 1)]),
            IndexModel([("tenant_id", 1), ("category", 1)]),
            IndexModel([("tenant_id", 1), ("order", 1)]),
        ]
