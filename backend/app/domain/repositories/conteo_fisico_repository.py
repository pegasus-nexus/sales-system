from typing import List, Optional
from abc import ABC, abstractmethod
from app.domain.models.conteo_fisico import ConteoFisico

class ConteoFisicoRepository(ABC):
    @abstractmethod
    async def get_by_id(self, conteo_id: str, tenant_id: str) -> Optional[ConteoFisico]:
        pass

    @abstractmethod
    async def create(self, conteo: ConteoFisico) -> ConteoFisico:
        pass

    @abstractmethod
    async def update(self, conteo: ConteoFisico) -> ConteoFisico:
        pass

    @abstractmethod
    async def list_by_tenant_and_sucursal(self, tenant_id: str, sucursal_id: Optional[str] = None) -> List[ConteoFisico]:
        pass
