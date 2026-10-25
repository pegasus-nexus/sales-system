from beanie import Document
from pydantic import Field, BaseModel
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from .base import DecimalMoney

class EstadoCotizacion(str, Enum):
    BORRADOR   = "BORRADOR"     # Creándose o editándose
    ENVIADA    = "ENVIADA"      # Enviada al cliente por WhatsApp / PDF
    APROBADA   = "APROBADA"     # Cliente aprobó la propuesta
    FACTURADA  = "FACTURADA"    # Convertida en venta formal y cobrada
    RECHAZADA  = "RECHAZADA"    # Vencida o declinada por el cliente

class CotizacionItem(BaseModel):
    producto_id: str
    descripcion: str
    codigo_corto: Optional[str] = None
    cantidad: float
    precio_unitario: DecimalMoney
    descuento_unitario: DecimalMoney = DecimalMoney("0.0")
    subtotal: DecimalMoney

class CotizacionCliente(BaseModel):
    cliente_id: Optional[str] = None
    nombre_razon_social: str
    nit_ci: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None

class Cotizacion(Document):
    """
    Representa una proforma, presupuesto o cotización para ventas
    institucionales, servicios o venta mayorista / B2B.
    No descuenta stock físico hasta que se convierte formalmente en Venta.
    """
    tenant_id: str
    sucursal_id: str = "CENTRAL"
    almacen_id: str = "default"
    numero_cotizacion: str       # Ej: COT-0001
    
    cliente: CotizacionCliente
    items: List[CotizacionItem]
    
    subtotal: DecimalMoney = DecimalMoney("0.0")
    descuento_global: DecimalMoney = DecimalMoney("0.0")
    total: DecimalMoney = DecimalMoney("0.0")
    
    validez_dias: int = 15
    estado: EstadoCotizacion = EstadoCotizacion.BORRADOR
    
    notas: Optional[str] = None
    condiciones_comerciales: Optional[str] = "Precios sujetos a disponibilidad de stock. Validez según fecha estipulada."
    
    # Trazabilidad
    vendedor_id: str
    vendedor_nombre: str
    sale_id: Optional[str] = None # ID de la Venta cuando pasa a FACTURADA
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "cotizaciones"
        indexes = [
            "tenant_id",
            "sucursal_id",
            "estado",
            "created_at",
            [("tenant_id", 1), ("numero_cotizacion", 1)],
            [("tenant_id", 1), ("created_at", -1)],
        ]
