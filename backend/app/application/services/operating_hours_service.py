from typing import List
from app.domain.repositories.operating_hours_repository import BranchOperatingHoursRepository
from app.domain.models.branch_operating_hours import BranchOperatingHours


class OperatingHoursService:
    def __init__(self, repo: BranchOperatingHoursRepository):
        self.repo = repo

    async def get_operating_hours(self, tenant_id: str, sucursal_id: str) -> BranchOperatingHours:
        doc = await self.repo.get_by_sucursal(tenant_id, sucursal_id)
        if not doc:
            return BranchOperatingHours(
                tenant_id=tenant_id,
                sucursal_id=sucursal_id,
                sucursal_nombre="Sucursal",
                opening_time="08:00",
                closing_time="21:00",
                allow_after_hours=True
            )
        return doc

    async def get_all_operating_hours(self, tenant_id: str) -> List[BranchOperatingHours]:
        return await self.repo.get_all_by_tenant(tenant_id)

    async def save_operating_hours(
        self,
        tenant_id: str,
        sucursal_id: str,
        sucursal_nombre: str,
        opening_time: str,
        closing_time: str,
        allow_after_hours: bool = True
    ) -> BranchOperatingHours:
        return await self.repo.upsert_operating_hours(
            tenant_id=tenant_id,
            sucursal_id=sucursal_id,
            sucursal_nombre=sucursal_nombre,
            opening_time=opening_time,
            closing_time=closing_time,
            allow_after_hours=allow_after_hours
        )
