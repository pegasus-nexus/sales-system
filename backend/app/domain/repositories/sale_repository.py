from abc import ABC, abstractmethod
from typing import Optional, List
from app.domain.repositories.base_repository import BaseRepository
from app.domain.models.sale import Sale

class ISaleRepository(BaseRepository[Sale], ABC):
    """
    Interface for the Sale Repository to abstract database access.
    """
    @abstractmethod
    async def find_by_id_and_tenant(self, id: str, tenant_id: str, session=None) -> Optional[Sale]:
        pass

    @abstractmethod
    async def find_last_by_sucursal(self, tenant_id: str, sucursal_id: str, session=None) -> Optional[Sale]:
        pass
