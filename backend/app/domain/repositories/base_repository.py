from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional, Any

T = TypeVar('T')

class BaseRepository(ABC, Generic[T]):
    """
    Interfaz genérica del Patrón Repositorio.
    Abstrae las operaciones básicas CRUD para que los servicios no conozcan la tecnología de Base de Datos.
    """
    
    @abstractmethod
    async def get_by_id(self, id: str, session=None) -> Optional[T]:
        pass

    @abstractmethod
    async def get_all(self, tenant_id: str, limit: int = 100, skip: int = 0, session=None) -> List[T]:
        pass

    @abstractmethod
    async def add(self, entity: T, session=None) -> T:
        pass

    @abstractmethod
    async def update(self, entity: T, session=None) -> T:
        pass

    @abstractmethod
    async def delete(self, id: str, session=None) -> bool:
        pass
