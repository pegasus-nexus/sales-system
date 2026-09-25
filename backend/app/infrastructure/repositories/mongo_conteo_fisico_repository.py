from typing import List, Optional
from beanie import PydanticObjectId
from app.domain.models.conteo_fisico import ConteoFisico
from app.domain.repositories.conteo_fisico_repository import ConteoFisicoRepository

class MongoConteoFisicoRepository(ConteoFisicoRepository):
    async def get_by_id(self, conteo_id: str, tenant_id: str) -> Optional[ConteoFisico]:
        try:
            return await ConteoFisico.find_one(
                ConteoFisico.id == PydanticObjectId(conteo_id),
                ConteoFisico.tenant_id == tenant_id
            )
        except Exception:
            return None

    async def create(self, conteo: ConteoFisico) -> ConteoFisico:
        return await conteo.insert()

    async def update(self, conteo: ConteoFisico) -> ConteoFisico:
        return await conteo.save()

    async def list_by_tenant_and_sucursal(self, tenant_id: str, sucursal_id: Optional[str] = None) -> List[ConteoFisico]:
        query = {"tenant_id": tenant_id, "is_active": True}
        if sucursal_id:
            query["sucursal_id"] = sucursal_id
        
        return await ConteoFisico.find(query).sort("-fecha_inicio").to_list()
