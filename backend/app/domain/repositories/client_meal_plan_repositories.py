from app.domain.repositories.base_repository import BaseRepository
from app.domain.models.client_meal_plan import ClientMealPlan

class IClientMealPlanRepository(BaseRepository[ClientMealPlan]):
    pass
