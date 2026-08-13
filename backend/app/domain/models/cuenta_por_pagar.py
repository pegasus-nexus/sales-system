from typing import Optional, List
from beanie import Document
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from .base import DecimalMoney

class MetodoPagoCompra(str, Enum):
    CONTADO_EFECTIVO = "CONTADO_EFECTIVO"
    CONTADO_QR = "CONTADO_QR"
    CONTADO_BANCO = "CONTADO_BANCO"
    CREDITO = "CREDITO"
    CONSIGNACION = "CONSIGNACION"

class EstadoCuentaPorPagar(str, Enum):
    PENDIENTE = "PENDIENTE"
    PARCIAL = "PARCIAL"
    PAGADO = "PAGADO"
    CANCELADO = "CANCELADO"

class TransaccionPagoProveedor(BaseModel):
    id_transaccion: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y%m%d%H%M%S"))
    fecha_pago: datetime = Field(default_factory=datetime.utcnow)
    monto: DecimalMoney
    metodo_pago: str
    referencia: Optional[str] = None
    registrado_por: str  # usuario_id

class CuentaPorPagar(Document):
    """
    Representa una deuda con un proveedor por una compra a Crédito o Consignación.
    """
    tenant_id: str
    sucursal_id: str
    proveedor_id: str
    proveedor_nombre: str
    purchase_reception_id: str
    numero_documento: str
    
    monto_total: DecimalMoney
    monto_pagado: DecimalMoney = DecimalMoney("0.0")
    saldo_pendiente: DecimalMoney
    
    estado: EstadoCuentaPorPagar = EstadoCuentaPorPagar.PENDIENTE
    fecha_emision: datetime = Field(default_factory=datetime.utcnow)
    fecha_vencimiento: Optional[datetime] = None
    
    pagos: List[TransaccionPagoProveedor] = []
    notas: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "cuentas_por_pagar"
        indexes = [
            "tenant_id",
            "sucursal_id",
            "proveedor_id",
            "estado"
        ]
