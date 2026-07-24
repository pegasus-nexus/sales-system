from typing import List, Optional
from bson import ObjectId
from app.domain.models.compra import PurchaseOrder, PurchaseReception
from app.domain.repositories.compra import IPurchaseOrderRepository, IPurchaseReceptionRepository
from motor.motor_asyncio import AsyncIOMotorClientSession

class PurchaseOrderRepository(IPurchaseOrderRepository):
    async def create(self, order: PurchaseOrder, session: AsyncIOMotorClientSession = None) -> PurchaseOrder:
        await order.insert(session=session)
        return order

    async def get_by_id(self, tenant_id: str, sucursal_id: str, order_id: str, session: AsyncIOMotorClientSession = None) -> Optional[PurchaseOrder]:
        return await PurchaseOrder.find_one(
            PurchaseOrder.id == ObjectId(order_id),
            PurchaseOrder.tenant_id == tenant_id,
            PurchaseOrder.sucursal_id == sucursal_id,
            session=session
        )

    async def update(self, order: PurchaseOrder, session: AsyncIOMotorClientSession = None) -> PurchaseOrder:
        await order.save(session=session)
        return order

    async def list_by_tenant(self, tenant_id: str, sucursal_id: str, session: AsyncIOMotorClientSession = None) -> List[PurchaseOrder]:
        return await PurchaseOrder.find(
            PurchaseOrder.tenant_id == tenant_id,
            PurchaseOrder.sucursal_id == sucursal_id,
            session=session
        ).sort("-created_at").to_list()


class PurchaseReceptionRepository(IPurchaseReceptionRepository):
    async def create(self, reception: PurchaseReception, session: AsyncIOMotorClientSession = None) -> PurchaseReception:
        await reception.insert(session=session)
        return reception

    async def get_by_id(self, tenant_id: str, sucursal_id: str, reception_id: str, session: AsyncIOMotorClientSession = None) -> Optional[PurchaseReception]:
        return await PurchaseReception.find_one(
            PurchaseReception.id == ObjectId(reception_id),
            PurchaseReception.tenant_id == tenant_id,
            PurchaseReception.sucursal_id == sucursal_id,
            session=session
        )

    async def list_by_tenant(self, tenant_id: str, sucursal_id: str, session: AsyncIOMotorClientSession = None) -> List[PurchaseReception]:
        return await PurchaseReception.find(
            PurchaseReception.tenant_id == tenant_id,
            PurchaseReception.sucursal_id == sucursal_id,
            session=session
        ).sort("-created_at").to_list()
