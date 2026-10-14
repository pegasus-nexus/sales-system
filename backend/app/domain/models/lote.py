from typing import Optional
from datetime import datetime, timezone
from decimal import Decimal
from beanie import Document
from pydantic import Field
from pymongo import IndexModel
from app.domain.models.base import DecimalMoney, SoftDeleteMixin

class LoteInventario(Document, SoftDeleteMixin):
    """
    Rastreo de lotes y fechas de caducidad para trazabilidad ERP.
    Permite métodos de valoración FEFO / FIFO y control de perecederos/sanitario.
    """
    tenant_id: str
    sucursal_id: str
    almacen_id: str = "default"
    producto_id: str
    lote_codigo: str
    fecha_vencimiento: Optional[datetime] = None
    cantidad_inicial: float = 0.0
    cantidad_actual: float = 0.0
    costo_unitario: DecimalMoney = Field(default=Decimal("0.00"))
    estado: str = "ACTIVO"  # ACTIVO, AGOTADO, VENCIDO, BLOQUEADO
    proveedor_id: Optional[str] = None
    proveedor_nombre: Optional[str] = None
    reception_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "lotes_inventario"
        indexes = [
            "tenant_id",
            "sucursal_id",
            "almacen_id",
            "producto_id",
            "lote_codigo",
            "fecha_vencimiento",
            "estado",
            IndexModel(
                [("tenant_id", 1), ("sucursal_id", 1), ("almacen_id", 1), ("producto_id", 1), ("lote_codigo", 1)],
                unique=True,
                name="tenant_branch_warehouse_product_lot_unique"
            ),
            [("tenant_id", 1), ("producto_id", 1), ("fecha_vencimiento", 1)],
            [("tenant_id", 1), ("producto_id", 1), ("cantidad_actual", -1)],
        ]
