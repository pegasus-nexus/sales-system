from app.domain.uow.base_uow import BaseUnitOfWork
from app.infrastructure.uow.mongo_uow import MongoUnitOfWork
from app.domain.repositories.production_repositories import IMealScheduleRepository, IRecipeIngredientRepository
from app.infrastructure.repositories.mongo_production_repositories import MongoMealScheduleRepository, MongoRecipeIngredientRepository
from app.domain.repositories.inventory_repositories import IAlmacenRepository, IInventoryRepository
from app.infrastructure.repositories.mongo_inventory_repositories import MongoAlmacenRepository, MongoInventoryRepository
from app.domain.repositories.client_meal_plan_repositories import IClientMealPlanRepository
from app.infrastructure.repositories.mongo_client_meal_plan_repositories import MongoClientMealPlanRepository
from app.domain.repositories.base_repository import BaseRepository
from app.infrastructure.repositories.mongo_base_repository import MongoBaseRepository
from app.domain.models.inventario import InventoryLog
from app.domain.models.product import Product

from app.application.services.production_service import ProductionService

def get_uow() -> BaseUnitOfWork:
    return MongoUnitOfWork()

def get_meal_schedule_repo() -> IMealScheduleRepository:
    return MongoMealScheduleRepository()

def get_recipe_ingredient_repo() -> IRecipeIngredientRepository:
    return MongoRecipeIngredientRepository()

def get_almacen_repo() -> IAlmacenRepository:
    return MongoAlmacenRepository()

def get_inventory_repo() -> IInventoryRepository:
    return MongoInventoryRepository()

def get_inventory_log_repo() -> BaseRepository[InventoryLog]:
    return MongoBaseRepository(InventoryLog)

def get_client_meal_plan_repo() -> IClientMealPlanRepository:
    return MongoClientMealPlanRepository()

def get_product_repo() -> BaseRepository[Product]:
    return MongoBaseRepository(Product)

def get_production_service() -> ProductionService:
    return ProductionService(
        uow=get_uow(),
        schedule_repo=get_meal_schedule_repo(),
        ingredient_repo=get_recipe_ingredient_repo(),
        almacen_repo=get_almacen_repo(),
        inventory_repo=get_inventory_repo(),
        inventory_log_repo=get_inventory_log_repo(),
        client_plan_repo=get_client_meal_plan_repo(),
        product_repo=get_product_repo()
    )
