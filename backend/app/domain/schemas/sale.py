"""
Pydantic schemas for the Sales domain.

Extracted from sales.py endpoint to allow independent development
of schemas vs endpoint logic.
"""

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.domain.models.sale import DescuentoInfo


class SaleItemIn(BaseModel):
    """A single item line in a sale request."""
    producto_id: str
    # SECURITY: gt=0 prevents negative quantity injection which would INCREASE stock
    # instead of decreasing it, and allow registering sales for 0 Bs or negative amounts.
    cantidad: int = Field(..., gt=0, description="Cantidad de unidades vendidas. Debe ser positiva.")
    precio_unitario: float = Field(default=0.0, ge=0.0)  # if 0, falls back to product.precio_venta
    descuento_unitario: float = Field(default=0.0, ge=0.0)
    almacen_id: str | None = None  # Override por-ítem. Si None, hereda almacen_id global de SaleCreate


class PagoIn(BaseModel):
    """One payment segment (supports split payments)."""
    metodo: Literal["EFECTIVO", "QR", "TARJETA", "TRANSFERENCIA", "CREDITO"]
    monto: float = Field(..., gt=0, description="Monto del pago. Debe ser positivo.")

class AbonoCreate(BaseModel):
    """Request body to pay off portions of a credit sale."""
    metodo: Literal["EFECTIVO", "QR", "TARJETA", "TRANSFERENCIA"]
    monto: float = Field(..., gt=0, description="Monto del abono. Debe ser positivo.")


class ClienteIn(BaseModel):
    """Optional invoice / billing data provided at point of sale."""
    nit: str | None = None
    razon_social: str | None = None
    email: str | None = None
    telefono: str | None = None
    es_factura: bool = False
    is_miembro_comunidad: bool = False


class SaleCreate(BaseModel):
    """Request body for creating a new sale."""
    sucursal_id: str | None = None
    almacen_id: str = "default"
    items: list[SaleItemIn]
    pagos: list[PagoIn] = []
    descuento: DescuentoInfo | None = None
    cliente_id: str | None = None
    cliente: ClienteIn | None = None
    vendedor_id: str | None = None
    vendedor_name: str | None = None
    fecha_venta: datetime | None = None
    send_whatsapp: bool = False
    idempotency_key: str | None = None
    confirm_duplicate: bool = False


class SalesPaginated(BaseModel):
    """Paginated response for GET /sales."""
    items: list
    total: int
    page: int
    pages: int


class AnulacionCreate(BaseModel):
    """Request body for cancelling a sale with intelligent payment correction."""
    motivo: Literal[
        "ERROR_COBRO",
        "DEVOLUCION_CLIENTE",
        "PRODUCTO_DEFECTUOSO",
        "VENTA_DUPLICADA",
        "OTRO"
    ]
    notas: str | None = None
    # Solo requerido si motivo == "ERROR_COBRO"
    metodo_pago_correcto: Literal["EFECTIVO", "QR", "TARJETA", "TRANSFERENCIA"] | None = None


class QRInfoUpdate(BaseModel):
    """Request body to confirm a QR payment."""
    banco: str
    referencia: str
    monto_transferido: float

class ListaPrecioItemResponse(BaseModel):
    id: str
    producto_id: str
    precio: Decimal
    moneda: str = "Bs"
    vigente: bool = True

    model_config = ConfigDict(from_attributes=True)


class SaleDateUpdate(BaseModel):
    nueva_fecha: datetime
