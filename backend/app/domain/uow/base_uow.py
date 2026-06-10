from abc import ABC, abstractmethod

class BaseUnitOfWork(ABC):
    """
    Interfaz genérica del Patrón Unit of Work (Unidad de Trabajo).
    Garantiza transacciones atómicas independientes del ORM/ODM (MongoDB o PostgreSQL).
    """

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            await self.rollback()
        else:
            await self.commit()

    @abstractmethod
    async def commit(self):
        """Confirma la transacción actual."""
        pass

    @abstractmethod
    async def rollback(self):
        """Deshace la transacción actual en caso de error."""
        pass
