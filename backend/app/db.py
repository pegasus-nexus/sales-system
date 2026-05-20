import motor.motor_asyncio
from beanie import init_beanie
from app.models.user import User
from app.models.tenant import Tenant
from app.models.sucursal import Sucursal
from app.models.product import Product
from app.models.inventario import Inventario, InventoryLog
from app.models.pedido_interno import PedidoInterno
from app.models.sale import Sale
from app.models.category import Category
from app.models.audit import AuditLog
from app.models.descuento import Descuento
from app.models.caja import CajaMovimiento, CajaSesion, CajaGastoCategoria
from app.models.plan import Plan
from app.models.sale_item import SaleItem
from app.models.cost_history import ProductCostHistory
from app.models.price_request import PriceChangeRequest
from app.models.plan_feature import PlanFeatureDocument
from app.models.pedido_item import PedidoItemDocument
from app.models.cliente import Cliente
from app.models.price_list import ListaPrecio, ListaPrecioItem

from app.core.config import settings

class ClientWrapper:
    def __init__(self, client):
        self._client = client
    def __getattr__(self, name):
        if name == "append_metadata":
            return lambda *args, **kwargs: None
        return getattr(self._client, name)

class BeanieFixWrapper:
    def __init__(self, db):
        self._db = db
    def __getitem__(self, item):
        return self._db[item]
    def __getattr__(self, name):
        if name == "client":
            return ClientWrapper(self._db.client)
        return getattr(self._db, name)

_mongo_client = None

async def get_raw_db():
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = motor.motor_asyncio.AsyncIOMotorClient(
            settings.MONGODB_URL,
            maxPoolSize=100,
            minPoolSize=10
        )
    return _mongo_client.salessystem

async def init_db():
    global _mongo_client
    try:
        if _mongo_client is None:
            _mongo_client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGODB_URL,
                maxPoolSize=100,
                minPoolSize=10
            )
        db = _mongo_client.salessystem
        await init_beanie(
            database=BeanieFixWrapper(db),
            document_models=[
                User,
                Tenant,
                Sucursal,
                Product,
                Inventario,
                InventoryLog,
                PedidoInterno,
                Sale,
                Category,
                AuditLog,
                Descuento,
                CajaMovimiento,
                CajaSesion,
                CajaGastoCategoria,
                Plan,
                SaleItem,
                ProductCostHistory,
                PriceChangeRequest,
                PlanFeatureDocument,
                PedidoItemDocument,
                Cliente,
                ListaPrecio,
                ListaPrecioItem,
            ]
        )
    except Exception as e:
        print(f"Warning: Beanie init failed (likely Python 3.13 incompatibility): {e}")
        # We continue as Analytics now use get_raw_db()
