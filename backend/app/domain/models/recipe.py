from beanie import Document
from pydantic import Field
from datetime import datetime, timezone
from typing import Optional
from enum import Enum
from .base import SoftDeleteMixin

class RecipeType(str, Enum):
    PLATO_FINAL = "PLATO_FINAL"
    BASE = "BASE"
    PROTEINA = "PROTEINA"
    TOPPING = "TOPPING"
    SALSAS = "SALSAS"
    BEBIDA = "BEBIDA"
    COMPLEMENTO = "COMPLEMENTO"

class Recipe(Document, SoftDeleteMixin):
    """
    Representa una Receta, Platillo o un Componente de un Bowl.
    """
    tenant_id: str
    nombre: str
    descripcion: Optional[str] = None
    tipo: RecipeType = RecipeType.PLATO_FINAL
    precio_extra: Optional[float] = 0.0 # Por si este topping tiene costo extra en el bowl
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "recipes"
        indexes = [
            "tenant_id",
            "tipo",
            [("tenant_id", 1), ("is_active", 1)],
        ]
