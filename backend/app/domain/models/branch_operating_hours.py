from datetime import datetime, timezone
from beanie import Document
from pydantic import Field


class BranchOperatingHours(Document):
    tenant_id: str
    sucursal_id: str
    sucursal_nombre: str = "Sucursal"
    opening_time: str = "08:00"
    closing_time: str = "21:00"
    allow_after_hours: bool = True
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "branch_operating_hours"
        indexes = [
            "tenant_id",
            "sucursal_id",
            [("tenant_id", 1), ("sucursal_id", 1)],
        ]
