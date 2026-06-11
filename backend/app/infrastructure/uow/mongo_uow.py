from app.domain.uow.base_uow import BaseUnitOfWork
from app.infrastructure.db import get_client

class MongoUnitOfWork(BaseUnitOfWork):
    """
    Implementación de Unit of Work para MongoDB.
    Encapsula el manejo de start_session y start_transaction de MongoDB.
    """
    
    def __init__(self):
        self.client = get_client()
        self.session = None

    async def __aenter__(self):
        self.session = await self.client.start_session()
        self.session.start_transaction()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        try:
            if exc_type is not None:
                await self.rollback()
            else:
                await self.commit()
        finally:
            if self.session:
                await self.session.end_session()

    async def commit(self):
        if self.session and self.session.in_transaction:
            await self.session.commit_transaction()

    async def rollback(self):
        if self.session and self.session.in_transaction:
            await self.session.abort_transaction()
