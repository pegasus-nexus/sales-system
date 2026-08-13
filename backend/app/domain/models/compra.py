from typing import List, Optional
from beanie import Document
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from .base import DecimalMoney

class PurchaseOrderStatus(str, Enum):
    BORRADOR = "BORRADOR"
    ENVIADO = "ENVIADO"
    PARCIAL = "PARCIAL"
    COMPLETADO = "COMPLETADO"
    CANCELADO = "CANCELADO"

class PurchaseOrderItem(BaseModel):
    producto_id: str
    nombre_producto: str
    codigo_producto: str
    cantidad_pedida: float
    cantidad_recibida: float = 0.0
    costo_unitario_estimado: DecimalMoney = DecimalMoney("0.0")
    subtotal: DecimalMoney = DecimalMoney("0.0")

class PurchaseOrder(Document):
    """
    Representa un Pedido de Compra al proveedor. No afecta stock.
    """
    tenant_id: str
    sucursal_id: str
    proveedor_id: str
    proveedor_nombre: str
    numero_pedido: str
    estado: PurchaseOrderStatus = PurchaseOrderStatus.BORRADOR
    fecha_emision: datetime = Field(default_factory=datetime.utcnow)
    fecha_esperada: Optional[datetime] = None
    detalles: List[PurchaseOrderItem] = []
    total_estimado: DecimalMoney = DecimalMoney("0.0")
    notas: Optional[str] = None
    creado_por: str  # usuario_id

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "purchase_orders"
        indexes = [
            "tenant_id",
            "sucursal_id",
            "proveedor_id",
            "estado",
            "numero_pedido"
        ]


class PurchaseReceptionItem(BaseModel):
    producto_id: str
    nombre_producto: str
    codigo_producto: str
    cantidad_recibida: float
    costo_unitario_real: DecimalMoney = DecimalMoney("0.0")
    subtotal: DecimalMoney = DecimalMoney("0.0")

class PurchaseReception(Document):
    """
    Representa el Ingreso Físico de Mercadería. Afecta stock y kárdex.
    """
    tenant_id: str
    sucursal_id: str
    proveedor_id: str
    proveedor_nombre: str
    purchase_order_id: Optional[str] = None
    numero_documento: str  # Factura, Recibo, Guía
    fecha_recepcion: datetime = Field(default_factory=datetime.utcnow)
    detalles: List[PurchaseReceptionItem] = []
    total_real: DecimalMoney = DecimalMoney("0.0")
    
    # Nuevos campos para Finanzas
    metodo_pago: str = "CONTADO_EFECTIVO" # Ej: CONTADO_EFECTIVO, CREDITO, CONSIGNACION
    estado_pago: str = "PAGADO" # Ej: PAGADO, PENDIENTE
    fecha_vencimiento_credito: Optional[datetime] = None
    
    notas: Optional[str] = None
    creado_por: str  # usuario_id

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "purchase_receptions"
        indexes = [
            "tenant_id",
            "sucursal_id",
            "proveedor_id",
            "purchase_order_id",
            "numero_documento"
        ]
