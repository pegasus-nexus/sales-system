from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from app.domain.models.recipe import RecipeType
from bson import ObjectId
from typing import Annotated
from pydantic import BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class RecipeIngredientCreate(BaseModel):
    producto_id: str
    cantidad: float
    unidad_medida_receta: str = "kg"
    tipo_almacen_origen: str = "MATERIA_PRIMA"
    es_opcional: bool = False
    notas: str = ""

class RecipeCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    tipo: RecipeType = RecipeType.PLATO_FINAL
    precio_extra: Optional[float] = 0.0
    ingredientes: List[RecipeIngredientCreate] = []

class RecipeUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[RecipeType] = None
    precio_extra: Optional[float] = None
    is_active: Optional[bool] = None

class RecipeIngredientResponse(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    producto_id: str
    cantidad: float
    unidad_medida_receta: str
    tipo_almacen_origen: str
    es_opcional: bool
    notas: str
    
    model_config = ConfigDict(populate_by_name=True)

class RecipeResponse(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    tenant_id: str
    nombre: str
    descripcion: Optional[str]
    tipo: RecipeType
    precio_extra: Optional[float]
    is_active: bool
    created_at: datetime
    # Opcional: incluir ingredientes en la respuesta completa
    ingredientes: Optional[List[RecipeIngredientResponse]] = None

    model_config = ConfigDict(populate_by_name=True)
