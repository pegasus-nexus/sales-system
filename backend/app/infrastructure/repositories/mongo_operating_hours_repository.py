from typing import List, Optional
from datetime import datetime, timezone
from app.domain.models.branch_operating_hours import BranchOperatingHours
from app.domain.repositories.operating_hours_repository import BranchOperatingHoursRepository


class MongoBranchOperatingHoursRepository(BranchOperatingHoursRepository):
    async def get_by_sucursal(self, tenant_id: str, sucursal_id: str) -> Optional[BranchOperatingHours]:
        return await BranchOperatingHours.find_one(
            BranchOperatingHours.tenant_id == tenant_id,
            BranchOperatingHours.sucursal_id == sucursal_id
        )

    async def get_all_by_tenant(self, tenant_id: str) -> List[BranchOperatingHours]:
        return await BranchOperatingHours.find(
            BranchOperatingHours.tenant_id == tenant_id
        ).to_list()

    async def upsert_operating_hours(
        self,
        tenant_id: str,
        sucursal_id: str,
        sucursal_nombre: str,
        opening_time: str,
        closing_time: str,
        allow_after_hours: bool = True
    ) -> BranchOperatingHours:
        existing = await self.get_by_sucursal(tenant_id, sucursal_id)
        if existing:
            existing.sucursal_nombre = sucursal_nombre
            existing.opening_time = opening_time
            existing.closing_time = closing_time
            existing.allow_after_hours = allow_after_hours
            existing.updated_at = datetime.now(timezone.utc)
            await existing.save()
            return existing
        
        new_doc = BranchOperatingHours(
            tenant_id=tenant_id,
            sucursal_id=sucursal_id,
            sucursal_nombre=sucursal_nombre,
            opening_time=opening_time,
            closing_time=closing_time,
            allow_after_hours=allow_after_hours,
            updated_at=datetime.now(timezone.utc)
        )
        await new_doc.insert()
        return new_doc
