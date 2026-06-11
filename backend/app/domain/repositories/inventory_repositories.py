from abc import abstractmethod
from typing import Dict, Any, List, Optional
from app.domain.repositories.base_repository import BaseRepository
from app.domain.models.inventario import Inventario
from app.domain.models.almacen import Almacen

class IAlmacenRepository(BaseRepository[Almacen]):
    @abstractmethod
    async def get_by_sucursal(self, tenant_id: str, sucursal_id: str, session=None) -> List[Almacen]:
        pass

class IInventoryRepository(BaseRepository[Inventario]):
    @abstractmethod
    async def deduct_inventory_atomic(
        self, 
        tenant_id: str, 
        sucursal_id: str, 
        almacen_id: str, 
        producto_id: str, 
        cantidad: float, 
        session=None
    ) -> Dict[str, Any]:
        """
        Resta inventario de forma atómica. Devuelve el documento actualizado.
        """
        pass
