from typing import Optional
from bson import ObjectId
from app.domain.repositories.sale_repository import ISaleRepository
from app.infrastructure.repositories.mongo_base_repository import MongoBaseRepository
from app.domain.models.sale import Sale

class MongoSaleRepository(MongoBaseRepository[Sale], ISaleRepository):
    """
    MongoDB implementation of the Sale repository using Beanie.
    """
    def __init__(self):
        super().__init__(Sale)

    async def find_by_id_and_tenant(self, id: str, tenant_id: str, session=None) -> Optional[Sale]:
        try:
            return await Sale.find_one(
                Sale.id == ObjectId(id),
                Sale.tenant_id == tenant_id,
                session=session
            )
        except Exception:
            return None

    async def find_last_by_sucursal(self, tenant_id: str, sucursal_id: str, session=None) -> Optional[Sale]:
        return await Sale.find_one(
            Sale.tenant_id == tenant_id,
            Sale.sucursal_id == sucursal_id,
            session=session
        ).sort(-Sale.created_at)

    async def find_recent_by_cashier(
        self, tenant_id: str, cashier_id: str, since_time, session=None
    ) -> list[Sale]:
        return await Sale.find(
            Sale.tenant_id == tenant_id,
            Sale.cashier_id == cashier_id,
            Sale.created_at >= since_time,
            Sale.anulada == False,
            session=session
        ).to_list()
