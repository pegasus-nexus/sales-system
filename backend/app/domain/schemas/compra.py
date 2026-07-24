from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.domain.models.base import DecimalMoney
from app.domain.models.compra import PurchaseOrderStatus

class PurchaseOrderItemCreate(BaseModel):
    producto_id: str
    nombre_producto: str
    codigo_producto: str
    cantidad_pedida: float
    costo_unitario_estimado: DecimalMoney
    subtotal: DecimalMoney

class PurchaseOrderCreate(BaseModel):
    sucursal_id: str
    proveedor_id: str
    proveedor_nombre: str
    numero_pedido: str
    fecha_esperada: Optional[datetime] = None
    detalles: List[PurchaseOrderItemCreate]
    total_estimado: DecimalMoney
    notas: Optional[str] = None

class PurchaseOrderUpdateStatus(BaseModel):
    estado: PurchaseOrderStatus


class PurchaseReceptionItemCreate(BaseModel):
    producto_id: str
    nombre_producto: str
    codigo_producto: str
    cantidad_recibida: float
    costo_unitario_real: DecimalMoney
    subtotal: DecimalMoney

class PurchaseReceptionCreate(BaseModel):
    sucursal_id: str
    proveedor_id: str
    proveedor_nombre: str
    purchase_order_id: Optional[str] = None
    numero_documento: str
    detalles: List[PurchaseReceptionItemCreate]
    total_real: DecimalMoney
    notas: Optional[str] = None
