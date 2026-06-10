from typing import List
from beanie.operators import In
from app.domain.models.meal_schedule import MealSchedule, MealScheduleStatus
from app.domain.models.recipe_ingredient import RecipeIngredient
from app.domain.repositories.production_repositories import IMealScheduleRepository, IRecipeIngredientRepository
from app.infrastructure.repositories.mongo_base_repository import MongoBaseRepository

class MongoMealScheduleRepository(MongoBaseRepository[MealSchedule], IMealScheduleRepository):
    def __init__(self):
        super().__init__(MealSchedule)

    async def get_by_date_and_status(self, tenant_id: str, fecha: str, estado: MealScheduleStatus) -> List[MealSchedule]:
        return await self.model_class.find(
            self.model_class.tenant_id == tenant_id,
            self.model_class.fecha_programada == fecha,
            self.model_class.estado == estado
        ).to_list()

class MongoRecipeIngredientRepository(MongoBaseRepository[RecipeIngredient], IRecipeIngredientRepository):
    def __init__(self):
        super().__init__(RecipeIngredient)

    async def get_by_recipe_ids(self, tenant_id: str, recipe_ids: List[str], session=None) -> List[RecipeIngredient]:
        query = self.model_class.find(
            self.model_class.tenant_id == tenant_id,
            In(self.model_class.recipe_id, recipe_ids)
        )
        if session:
            return await query.to_list(session=session)
        return await query.to_list()
