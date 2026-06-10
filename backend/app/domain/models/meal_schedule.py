from beanie import Document
from pydantic import Field
from datetime import datetime, date
from typing import Optional, List
from enum import Enum

class MealScheduleStatus(str, Enum):
    PROGRAMADO = "PROGRAMADO"
    ENTREGADO = "ENTREGADO"
    POSTPERGADO = "POSTPERGADO"
    CANCELADO = "CANCELADO"

class MealSchedule(Document):
    """
    El calendario de comidas de un cliente. Representa un plato en un día específico.
    """
    tenant_id: str
    cliente_id: str
    client_meal_plan_id: str
    fecha_programada: str # Usamos string YYYY-MM-DD para facilitar queries o datetime si necesitamos hora
    recetas_ids: List[str] = Field(default_factory=list) # Las recetas/ingredientes que componen este bowl hoy
    estado: MealScheduleStatus = MealScheduleStatus.PROGRAMADO
    motivo_postergacion: Optional[str] = None
    entregado_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "meal_schedules"
        indexes = [
            "tenant_id",
            "cliente_id",
            "client_meal_plan_id",
            "fecha_programada",
            "estado",
            [("tenant_id", 1), ("fecha_programada", 1), ("estado", 1)]
        ]
