from typing import Optional
from beanie import Document
from pydantic import Field
from datetime import datetime, timezone

from .base import SoftDeleteMixin

class Category(Document, SoftDeleteMixin):
    tenant_id: str
    name: str
    description: Optional[str] = None
    web_collection: Optional[str] = None
    show_on_web: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "categories"
        indexes = [
            "tenant_id",
            "name",
            "is_active"
        ]
