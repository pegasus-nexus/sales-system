from beanie import Document
from pydantic import Field
from datetime import datetime
from .almacen import TipoAlmacen

class RecipeIngredient(Document):
    """
    Define los ingredientes (BOM - Bill of Materials) que componen una Receta.
    """
    tenant_id: str
    recipe_id: str
    producto_id: str # Referencia al Product._id
    cantidad: float = 0.0 # Ej. 0.100 para 100g si el producto principal se mide en Kg
    unidad_medida_receta: str = "kg" # Informativo, la deducción se hace basada en la unidad base del producto
    tipo_almacen_origen: TipoAlmacen = TipoAlmacen.MATERIA_PRIMA # Para deducir del almacén correcto de la sucursal
    es_opcional: bool = False
    notas: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "recipe_ingredients"
        indexes = [
            "tenant_id",
            "recipe_id",
            "producto_id",
            [("tenant_id", 1), ("recipe_id", 1)],
        ]
