from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import Optional
from .base import DecimalMoney, SoftDeleteMixin

class MealPlanTemplate(Document, SoftDeleteMixin):
    """
    Plantillas de planes de comida que la Dark Kitchen vende (Ej. Plan 20 almuerzos).
    """
    tenant_id: str
    nombre: str
    descripcion: Optional[str] = None
    cantidad_comidas: int
    dias_vigencia: int # Cuántos días tienen para consumir las comidas
    precio_sugerido: DecimalMoney = DecimalMoney("0.0")
    es_flexible: bool = True # Si false, se programan días consecutivos, si true el cliente elige qué días no come
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "meal_plan_templates"
        indexes = ["tenant_id"]
