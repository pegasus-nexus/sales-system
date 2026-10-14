from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.domain.models.base import DecimalMoney

class LoteResponse(BaseModel):
    id: str
    tenant_id: str
    sucursal_id: str
    almacen_id: str
    producto_id: str
    producto_nombre: Optional[str] = None
    producto_codigo: Optional[str] = None
    lote_codigo: str
    fecha_vencimiento: Optional[datetime] = None
    cantidad_inicial: float
    cantidad_actual: float
    costo_unitario: DecimalMoney
    estado: str
    dias_restantes: Optional[int] = None
    estado_vencimiento: str = "VIGENTE"  # VIGENTE, POR_VENCER, VENCIDO, SIN_FECHA
    proveedor_nombre: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class LotesPaginated(BaseModel):
    items: List[LoteResponse]
    total: int
    page: int
    pages: int

class LotesResumen(BaseModel):
    total_lotes_activos: int
    total_unidades: float
    por_vencer_30d: int
    vencidos: int
