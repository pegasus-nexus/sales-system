from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime

class AnalyticsRepository(ABC):
    @abstractmethod
    async def get_total_sales_and_orders(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime,
        sucursal_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retorna el total bruto de ventas y la cantidad de órdenes 
        para un rango de fechas.
        """
        pass

    @abstractmethod
    async def get_hourly_sales_distribution(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retorna el desglose de ventas por hora.
        """
        pass

    @abstractmethod
    async def get_sales_by_payment_method(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retorna el desglose de ventas por método de pago.
        """
        pass

    @abstractmethod
    async def get_raw_sales_for_period(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime,
        sucursal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retorna la lista de ventas crudas para análisis más detallados en memoria (ej. multi-año).
        """
        pass
