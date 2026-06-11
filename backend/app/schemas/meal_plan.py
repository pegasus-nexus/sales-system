from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId
from typing import Annotated
from pydantic import BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class MealPlanTemplateCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    cantidad_comidas: int
    dias_vigencia: int
    precio_sugerido: float = 0.0
    es_flexible: bool = True

class MealPlanTemplateUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    cantidad_comidas: Optional[int] = None
    dias_vigencia: Optional[int] = None
    precio_sugerido: Optional[float] = None
    es_flexible: Optional[bool] = None
    is_active: Optional[bool] = None

class MealPlanTemplateResponse(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    tenant_id: str
    nombre: str
    descripcion: Optional[str]
    cantidad_comidas: int
    dias_vigencia: int
    precio_sugerido: float
    es_flexible: bool
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True)
