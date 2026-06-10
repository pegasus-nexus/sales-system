from abc import abstractmethod
from typing import List, Optional
from app.domain.repositories.base_repository import BaseRepository
from app.domain.models.meal_schedule import MealSchedule, MealScheduleStatus
from app.domain.models.recipe_ingredient import RecipeIngredient

class IMealScheduleRepository(BaseRepository[MealSchedule]):
    """Interfaz específica para el repositorio de MealSchedule"""
    @abstractmethod
    async def get_by_date_and_status(self, tenant_id: str, fecha: str, estado: MealScheduleStatus) -> List[MealSchedule]:
        pass

class IRecipeIngredientRepository(BaseRepository[RecipeIngredient]):
    """Interfaz específica para el repositorio de RecipeIngredient"""
    @abstractmethod
    async def get_by_recipe_ids(self, tenant_id: str, recipe_ids: List[str], session=None) -> List[RecipeIngredient]:
        pass
