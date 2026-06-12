from typing import Dict, Any, List
from pymongo import ReturnDocument
from app.domain.models.inventario import Inventario
from app.domain.models.almacen import Almacen
from app.domain.repositories.inventory_repositories import IAlmacenRepository, IInventoryRepository
from app.infrastructure.repositories.mongo_base_repository import MongoBaseRepository

class MongoAlmacenRepository(MongoBaseRepository[Almacen], IAlmacenRepository):
    def __init__(self):
        super().__init__(Almacen)

    async def get_by_sucursal(self, tenant_id: str, sucursal_id: str, session=None) -> List[Almacen]:
        query = self.model_class.find(
            self.model_class.tenant_id == tenant_id,
            self.model_class.sucursal_id == sucursal_id,
            session=session
        )
        return await query.to_list()

class MongoInventoryRepository(MongoBaseRepository[Inventario], IInventoryRepository):
    def __init__(self):
        super().__init__(Inventario)

    async def deduct_inventory_atomic(
        self, 
        tenant_id: str, 
        sucursal_id: str, 
        almacen_id: str, 
        producto_id: str, 
        cantidad: float, 
        session=None
    ) -> Dict[str, Any]:
        
        inv_query = {
            "tenant_id": tenant_id,
            "sucursal_id": sucursal_id,
            "producto_id": producto_id,
        }
        if almacen_id == "default":
            inv_query["$or"] = [{"almacen_id": "default"}, {"almacen_id": {"$exists": False}}]
        else:
            inv_query["almacen_id"] = almacen_id

        return await self.model_class.get_pymongo_collection().find_one_and_update(
            inv_query,
            {
                "$inc": {"cantidad": -cantidad},
                "$setOnInsert": {
                    "tenant_id": tenant_id, 
                    "sucursal_id": sucursal_id, 
                    "producto_id": producto_id, 
                    "almacen_id": almacen_id
                }
            },
            return_document=ReturnDocument.AFTER,
            upsert=True,
            session=session.client_session if session and hasattr(session, "client_session") else session
        )
