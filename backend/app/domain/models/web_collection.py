from typing import List, Optional
from beanie import Document
from pydantic import Field
from datetime import datetime

from .base import SoftDeleteMixin

class WebCollection(Document, SoftDeleteMixin):
    tenant_id: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    categories_ids: List[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "web_collections"
        indexes = [
            "tenant_id",
            "name",
            "is_active"
        ]
