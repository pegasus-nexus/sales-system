from app.domain.models.client_meal_plan import ClientMealPlan
from app.domain.repositories.client_meal_plan_repositories import IClientMealPlanRepository
from app.infrastructure.repositories.mongo_base_repository import MongoBaseRepository

class MongoClientMealPlanRepository(MongoBaseRepository[ClientMealPlan], IClientMealPlanRepository):
    def __init__(self):
        super().__init__(ClientMealPlan)
