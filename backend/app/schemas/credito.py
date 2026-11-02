from typing import List, Literal, Optional
from pydantic import BaseModel


class PagoCreditoItemIn(BaseModel):
    metodo: Literal["EFECTIVO", "QR", "TARJETA", "TRANSFERENCIA"]
    monto: float
    banco: Optional[str] = None
    referencia: Optional[str] = None


class AbonoRequestIn(BaseModel):
    """
    Soporta pagos mixtos a una cuenta de crédito general, o si se manda deuda_id, a una deuda específica.
    """
    pagos: List[PagoCreditoItemIn]
    deuda_id: Optional[str] = None
    notas: Optional[str] = None


class DeudaResponse(BaseModel):
    id: str
    cuenta_id: str
    cliente_id: str
    sale_id: str
    monto_original: float
    saldo_pendiente: float
    fecha_emision: str
    estado: str


class TransaccionCreditoResponse(BaseModel):
    id: str
    tipo: str
    monto: float
    pagos: List[dict]
    deudas_afectadas: List[str]
    cajero_nombre: str
    created_at: str
    notas: Optional[str] = None


class CuentaCreditoResponse(BaseModel):
    id: str
    cliente_id: str
    saldo_total: float
    limite_credito: Optional[float] = None
    estado_cuenta: str
    created_at: str
    cliente_nombre: Optional[str] = None
    cliente_nit: Optional[str] = None
    cliente_telefono: Optional[str] = None


class CuentasCreditoPaginated(BaseModel):
    items: List[CuentaCreditoResponse]
    total: int
    page: int
    pages: int


class CreditoResumenKPIs(BaseModel):
    total_cartera_por_cobrar: float
    total_cuentas: int
    total_cuentas_morosas: int
    total_cuentas_al_dia: int
    total_abonado_hoy: float


class ClienteSimilarMatch(BaseModel):
    cliente_id: str
    nombre: str
    nit_ci: Optional[str] = None
    telefono: Optional[str] = None
    score_similitud: float  # Porcentaje entre 0.0 y 1.0 (ej. 0.85 = 85%)
    tiene_cuenta_credito: bool = False
    saldo_pendiente: float = 0.0


class VerificarSimilarIn(BaseModel):
    nombre: str
    nit_ci: Optional[str] = None
    telefono: Optional[str] = None


class CrearCuentaCreditoIn(BaseModel):
    cliente_id: Optional[str] = None  # Si ya existe en Cliente
    nombre: Optional[str] = None      # Si se creará un cliente nuevo
    nit_ci: Optional[str] = None
    telefono: Optional[str] = None
    limite_credito: Optional[float] = None
    confirmar_similar: bool = False   # Permite forzar creación si había advertencia
