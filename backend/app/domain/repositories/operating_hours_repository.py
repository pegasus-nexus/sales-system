from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.models.branch_operating_hours import BranchOperatingHours


class BranchOperatingHoursRepository(ABC):
    @abstractmethod
    async def get_by_sucursal(self, tenant_id: str, sucursal_id: str) -> Optional[BranchOperatingHours]:
        """Obtiene la configuración de horario operativo de una sucursal específica."""
        pass

    @abstractmethod
    async def get_all_by_tenant(self, tenant_id: str) -> List[BranchOperatingHours]:
        """Obtiene la lista de configuraciones de horario de todas las sucursales del tenant."""
        pass

    @abstractmethod
    async def upsert_operating_hours(
        self,
        tenant_id: str,
        sucursal_id: str,
        sucursal_nombre: str,
        opening_time: str,
        closing_time: str,
        allow_after_hours: bool = True
    ) -> BranchOperatingHours:
        """Crea o actualiza la configuración de horario operativo para una sucursal."""
        pass
