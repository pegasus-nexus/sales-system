from typing import List, Optional
from beanie import Document
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

from .base import SoftDeleteMixin

class EstadoConteo(str, Enum):
    BORRADOR = "BORRADOR"
    FINALIZADO = "FINALIZADO"

class ConteoItem(BaseModel):
    producto_id: str
    codigo_corto: Optional[str] = None
    descripcion: Optional[str] = None
    categoria_id: Optional[str] = None
    categoria_nombre: Optional[str] = None
    proveedores: Optional[List[str]] = Field(default_factory=list)
    stock_sistema: float = 0.0
    stock_fisico: Optional[float] = None  # None means not counted yet
    diferencia: float = 0.0               # fisico - sistema
    costo_unitario: float = 0.0           # para saber el valor de la diferencia monetaria
    valor_diferencia: float = 0.0         # diferencia * costo_unitario

class ConteoFisico(Document, SoftDeleteMixin):
    tenant_id: str
    sucursal_id: str
    estado: EstadoConteo = EstadoConteo.BORRADOR
    fecha_inicio: datetime = Field(default_factory=datetime.utcnow)
    fecha_cierre: Optional[datetime] = None
    creado_por: str  # ID o nombre del usuario
    creado_por_nombre: Optional[str] = None
    notas: Optional[str] = None
    items: List[ConteoItem] = Field(default_factory=list)

    class Settings:
        name = "conteos_fisicos"
        indexes = [
            "tenant_id",
            "sucursal_id",
            "estado",
            "fecha_inicio"
        ]
