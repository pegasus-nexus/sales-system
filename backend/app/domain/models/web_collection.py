from typing import List, Optional
from beanie import Document
from pydantic import Field
from datetime import datetime, timezone

from .base import SoftDeleteMixin

class WebCollection(Document, SoftDeleteMixin):
    tenant_id: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    categories_ids: List[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "web_collections"
        indexes = [
            "tenant_id",
            "name",
            "is_active"
        ]
