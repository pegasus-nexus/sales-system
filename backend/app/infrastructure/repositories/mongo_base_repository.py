from typing import TypeVar, Generic, Type, List, Optional
from beanie import Document
from bson import ObjectId

from app.domain.repositories.base_repository import BaseRepository

DocType = TypeVar("DocType", bound=Document)

class MongoBaseRepository(BaseRepository[DocType], Generic[DocType]):
    """
    Implementación base del Repositorio genérico usando Beanie (MongoDB).
    Cualquier repositorio específico de Mongo heredará de esta clase.
    """
    
    def __init__(self, model_class: Type[DocType]):
        self.model_class = model_class

    async def get_by_id(self, id: str, session=None) -> Optional[DocType]:
        try:
            return await self.model_class.get(ObjectId(id), session=session)
        except Exception:
            return None

    async def get_all(self, tenant_id: str, limit: int = 100, skip: int = 0, session=None) -> List[DocType]:
        query = self.model_class.find({"tenant_id": tenant_id}).skip(skip).limit(limit)
        return await query.to_list(session=session) if session else await query.to_list()

    async def add(self, entity: DocType, session=None) -> DocType:
        return await entity.insert(session=session)

    async def update(self, entity: DocType, session=None) -> DocType:
        return await entity.save(session=session)

    async def delete(self, id: str, session=None) -> bool:
        doc = await self.get_by_id(id, session=session)
        if doc:
            await doc.delete(session=session)
            return True
        return False
