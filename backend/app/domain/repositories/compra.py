from abc import ABC, abstractmethod
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClientSession
from app.domain.models.compra import PurchaseOrder, PurchaseReception

class IPurchaseOrderRepository(ABC):
    @abstractmethod
    async def create(self, order: PurchaseOrder, session: AsyncIOMotorClientSession = None) -> PurchaseOrder:
        pass

    @abstractmethod
    async def get_by_id(self, tenant_id: str, sucursal_id: str, order_id: str, session: AsyncIOMotorClientSession = None) -> Optional[PurchaseOrder]:
        pass

    @abstractmethod
    async def update(self, order: PurchaseOrder, session: AsyncIOMotorClientSession = None) -> PurchaseOrder:
        pass

    @abstractmethod
    async def list_by_tenant(self, tenant_id: str, sucursal_id: str, session: AsyncIOMotorClientSession = None) -> List[PurchaseOrder]:
        pass


class IPurchaseReceptionRepository(ABC):
    @abstractmethod
    async def create(self, reception: PurchaseReception, session: AsyncIOMotorClientSession = None) -> PurchaseReception:
        pass

    @abstractmethod
    async def get_by_id(self, tenant_id: str, sucursal_id: str, reception_id: str, session: AsyncIOMotorClientSession = None) -> Optional[PurchaseReception]:
        pass

    @abstractmethod
    async def list_by_tenant(self, tenant_id: str, sucursal_id: str, session: AsyncIOMotorClientSession = None) -> List[PurchaseReception]:
        pass
