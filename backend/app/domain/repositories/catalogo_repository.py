from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any


class ICatalogoConfigRepository(ABC):
    """
    Contrato abstracto para persistencia y consulta de la configuración de catálogo.
    """
    @abstractmethod
    async def get_by_tenant_id(self, tenant_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create(self, config_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def update(self, tenant_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def is_slug_available(self, slug: str, exclude_tenant_id: Optional[str] = None) -> bool:
        pass


class ICatalogoProductoRepository(ABC):
    """
    Contrato abstracto para productos exhibidos en catálogo digital.
    """
    @abstractmethod
    async def get_by_id(self, product_id: str, tenant_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def list_by_tenant(self, tenant_id: str, only_available: bool = False) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def update(self, product_id: str, tenant_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def delete(self, product_id: str, tenant_id: str) -> bool:
        pass


class ICatalogoAuthRepository(ABC):
    """
    Contrato abstracto para operaciones de usuario y tenant requeridas en el registro de catálogo.
    Mantiene la capa de servicio completamente desacoplada de Beanie/MongoDB.
    """
    @abstractmethod
    async def find_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create_tenant(self, name: str, slug: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        pass
