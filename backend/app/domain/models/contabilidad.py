import enum
from typing import Optional, List
from datetime import datetime, timezone
from decimal import Decimal
from beanie import Document
from pydantic import BaseModel, Field
from app.domain.models.base import SoftDeleteMixin, DecimalMoney

class TipoCuenta(str, enum.Enum):
    ACTIVO = "ACTIVO"
    PASIVO = "PASIVO"
    PATRIMONIO = "PATRIMONIO"
    INGRESO = "INGRESO"
    COSTO = "COSTO"
    GASTO = "GASTO"

class NaturalezaCuenta(str, enum.Enum):
    DEUDORA = "DEUDORA"  # Activo, Costo, Gasto
    ACREEDORA = "ACREEDORA"  # Pasivo, Patrimonio, Ingreso

class CuentaContable(Document, SoftDeleteMixin):
    """Chart of Accounts - Plan de Cuentas"""
    tenant_id: str
    codigo: str          # e.g. "1.1.1", "4.1"
    nombre: str          # e.g. "Caja y Bancos"
    tipo: TipoCuenta
    naturaleza: NaturalezaCuenta
    padre_id: Optional[str] = None  # parent account code for hierarchy
    nivel: int = 1       # depth level 1-5
    es_cuenta_de_detalle: bool = True  # only detail accounts can have transactions
    descripcion: Optional[str] = None
    saldo_actual: DecimalMoney = Field(default=Decimal("0.00"))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "cuentas_contables"
        indexes = [
            "tenant_id",
            "codigo",
            "tipo",
            [("tenant_id", 1), ("codigo", 1)],
            [("tenant_id", 1), ("tipo", 1), ("is_active", 1)],
        ]

class LineaAsiento(BaseModel):
    """Individual line in an accounting entry"""
    cuenta_id: str
    cuenta_codigo: str
    cuenta_nombre: str
    debe: DecimalMoney = Field(default=Decimal("0.00"))
    haber: DecimalMoney = Field(default=Decimal("0.00"))
    descripcion: Optional[str] = None

class AsientoContable(Document):
    """Journal Entry - Asiento Contable"""
    tenant_id: str
    numero: int               # sequential number per tenant
    fecha: datetime
    descripcion: str
    lineas: List[LineaAsiento] = []
    total_debe: DecimalMoney = Field(default=Decimal("0.00"))
    total_haber: DecimalMoney = Field(default=Decimal("0.00"))
    referencia_tipo: Optional[str] = None  # "VENTA", "COMPRA", "GASTO", "MANUAL"
    referencia_id: Optional[str] = None
    es_automatico: bool = False
    anulado: bool = False
    creado_por: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "asientos_contables"
        indexes = [
            "tenant_id",
            "fecha",
            "numero",
            [("tenant_id", 1), ("fecha", -1)],
            [("tenant_id", 1), ("numero", -1)],
            [("tenant_id", 1), ("referencia_tipo", 1), ("referencia_id", 1)],
        ]
