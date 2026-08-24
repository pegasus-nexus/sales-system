from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime


class BIRepository(ABC):
    @abstractmethod
    async def get_raw_sales(
        self,
        tenant_id: str,
        start_utc: datetime,
        end_utc: datetime,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Extrae los documentos de la colección `sales` respetando el tenant y rango UTC."""
        pass

    @abstractmethod
    async def get_sucursales(self, tenant_id: str) -> List[Dict[str, Any]]:
        """Obtiene la dimensión de sucursales oficiales de la colección `sucursales`."""
        pass
