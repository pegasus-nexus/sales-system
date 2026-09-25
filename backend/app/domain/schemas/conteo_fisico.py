from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.domain.models.conteo_fisico import EstadoConteo

class ConteoItemSchema(BaseModel):
    producto_id: str
    codigo_corto: Optional[str] = None
    descripcion: Optional[str] = None
    stock_sistema: float
    stock_fisico: Optional[float] = None
    diferencia: float = 0.0
    costo_unitario: float = 0.0
    valor_diferencia: float = 0.0

class ConteoFisicoResponse(BaseModel):
    id: str
    tenant_id: str
    sucursal_id: str
    estado: EstadoConteo
    fecha_inicio: datetime
    fecha_cierre: Optional[datetime]
    creado_por: str
    creado_por_nombre: Optional[str]
    notas: Optional[str]
    items: List[ConteoItemSchema]

class ConteoFisicoListResponse(BaseModel):
    id: str
    tenant_id: str
    sucursal_id: str
    estado: EstadoConteo
    fecha_inicio: datetime
    fecha_cierre: Optional[datetime]
    creado_por_nombre: Optional[str]
    notas: Optional[str]
    total_items: int
    total_diferencia_items: float
    total_diferencia_monetaria: float

class IniciarConteoRequest(BaseModel):
    sucursal_id: str
    notas: Optional[str] = None

class GuardarConteoRequest(BaseModel):
    items: List[ConteoItemSchema]
    notas: Optional[str] = None
