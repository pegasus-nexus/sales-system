from abc import ABC, abstractmethod
from typing import Any

from app.domain.schemas.recordatorio import RecordatorioCreate


class RecordatorioRepository(ABC):
    """
    Contrato abstracto para el acceso a datos de Recordatorios e Incidencias.
    Desacopla la lógica de negocio de la tecnología de persistencia.
    """

    @abstractmethod
    async def get_by_id(self, recordatorio_id: str, tenant_id: str) -> Any | None:
        """Obtiene un recordatorio por ID asegurando aislamiento de tenant."""
        pass

    @abstractmethod
    async def list_by_filters(
        self,
        tenant_id: str,
        sucursal_id: str | None = None,
        categoria: str | None = None,
        prioridad: str | None = None,
        estado: str | None = None,
        search: str | None = None,
        limit: int = 100,
        skip: int = 0,
    ) -> list[Any]:
        """Lista recordatorios activos con filtros multi-criterio."""
        pass

    @abstractmethod
    async def count_kpis(
        self, tenant_id: str, sucursal_id: str | None = None
    ) -> dict[str, int]:
        """Calcula los 4 KPIs principales (total, pendientes, en_seguimiento, resueltos)."""
        pass

    @abstractmethod
    async def create(
        self,
        tenant_id: str,
        data: RecordatorioCreate,
        usuario_id: str,
        usuario_nombre: str,
        usuario_rol: str | None = None,
    ) -> Any:
        """Crea y persiste un nuevo recordatorio."""
        pass

    @abstractmethod
    async def update(self, recordatorio: Any) -> Any:
        """Actualiza un recordatorio existente."""
        pass

    @abstractmethod
    async def soft_delete(self, recordatorio_id: str, tenant_id: str) -> bool:
        """Inactiva un recordatorio (Soft delete garantizado)."""
        pass

    @abstractmethod
    async def list_categorias(self, tenant_id: str) -> list[Any]:
        """Lista las categorías personalizadas del tenant."""
        pass

    @abstractmethod
    async def get_categoria_by_nombre(self, tenant_id: str, nombre: str) -> Any | None:
        """Verifica si ya existe una categoría por nombre para el tenant."""
        pass

    @abstractmethod
    async def create_categoria(
        self,
        tenant_id: str,
        nombre: str,
        color: str | None = None,
        usuario_nombre: str | None = None,
    ) -> Any:
        """Crea y persiste una nueva categoría para el tenant."""
        pass
