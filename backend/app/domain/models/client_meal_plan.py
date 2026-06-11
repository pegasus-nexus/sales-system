from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import Optional
from enum import Enum

class ClientMealPlanStatus(str, Enum):
    ACTIVO = "ACTIVO"
    FINALIZADO = "FINALIZADO"
    CANCELADO = "CANCELADO"

class ClientMealPlan(Document):
    """
    La instancia de un Plan de Comidas asignado a un cliente.
    """
    tenant_id: str
    cliente_id: str
    template_id: str # Ref to MealPlanTemplate
    sale_id: Optional[str] = None # Ref to Sale document from POS
    fecha_inicio: datetime
    fecha_fin_estimada: datetime
    comidas_totales: int
    comidas_consumidas: int = 0
    estado: ClientMealPlanStatus = ClientMealPlanStatus.ACTIVO
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "client_meal_plans"
        indexes = [
            "tenant_id",
            "cliente_id",
            "estado"
        ]
