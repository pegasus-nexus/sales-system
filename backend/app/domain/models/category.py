from typing import Optional
from beanie import Document
from pydantic import Field
from datetime import datetime

from .base import SoftDeleteMixin

class Category(Document, SoftDeleteMixin):
    tenant_id: str
    name: str
    description: Optional[str] = None
    show_on_web: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "categories"
        indexes = [
            "tenant_id",
            "name",
            "is_active"
        ]
