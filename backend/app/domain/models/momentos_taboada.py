from typing import Optional, Dict, Literal
from datetime import datetime, timezone
from beanie import Document
from pydantic import Field


class PremioMomentosTaboada(Document):
    """
    Premios oficiales de la campaña Momentos Taboada con stock controlado por sucursal.
    """
    tenant_id: str
    codigo: str                                 # TAZA_NEGRA, TAZA_CORCHO, CORAZONES_DOS, CHOCO_ESPUMA
    nombre: str                                 # Elegante taza negra, Tu taza de corcho, etc.
    descripcion: str                            # 1 taza negra con logo dorado
    sellos_requeridos: int                      # 5, 10, 20, 30
    copago_bs: float                            # 19.0, 39.0, 69.0, 99.0
    stock_por_sucursal: Dict[str, int] = Field(default_factory=dict) # {"sucursal_id": stock_actual}
    imagen_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "momentos_taboada_premios"
        indexes = [
            "tenant_id",
            "codigo",
            "is_active",
            [("tenant_id", 1), ("codigo", 1)],
        ]


class CanjeMomentosTaboada(Document):
    """
    Registro inmutable de un canje de premio realizado por un cliente.
    """
    tenant_id: str
    sucursal_id: str
    sucursal_nombre: str
    cliente_id: Optional[str] = None
    cliente_nombre: str
    cliente_telefono: str
    premio_id: str
    premio_codigo: str
    premio_nombre: str
    sellos_utilizados: int
    copago_bs: float
    metodo_pago: Literal["EFECTIVO", "QR"] = "EFECTIVO"
    cajero_id: Optional[str] = None
    cajero_nombre: Optional[str] = None
    estado: Literal["COMPLETADO", "ANULADO"] = "COMPLETADO"
    notas: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "momentos_taboada_canjes"
        indexes = [
            "tenant_id",
            "sucursal_id",
            "cliente_telefono",
            "created_at",
            [("tenant_id", 1), ("created_at", -1)],
            [("tenant_id", 1), ("cliente_telefono", 1)],
        ]


class MovimientoCajaChicaTaboada(Document):
    """
    Caja Chica / Fondo Promocional exclusivo de Momentos Taboada (separado del POS del día).
    """
    tenant_id: str
    sucursal_id: str
    sucursal_nombre: str
    tipo: Literal["INGRESO_CANJE", "EGRESO_FONDO", "AJUSTE_FONDO"]
    monto: float
    metodo_pago: Literal["EFECTIVO", "QR", "OTRO"] = "EFECTIVO"
    canje_id: Optional[str] = None
    descripcion: str
    usuario_id: Optional[str] = None
    usuario_nombre: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "momentos_taboada_caja_chica"
        indexes = [
            "tenant_id",
            "sucursal_id",
            "tipo",
            "created_at",
            [("tenant_id", 1), ("created_at", -1)],
        ]


class MovimientoStockPremio(Document):
    """
    Auditoría inmutable de surtidos, ingresos y traslados de premios entre sucursales.
    """
    tenant_id: str
    premio_id: str
    premio_codigo: str
    premio_nombre: str
    tipo: Literal["SURTIDO_INGRESO", "TRASLADO_INTERNO", "AJUSTE_STOCK"]
    sucursal_origen_id: Optional[str] = None
    sucursal_origen_nombre: Optional[str] = None
    sucursal_destino_id: str
    sucursal_destino_nombre: str
    cantidad: int
    motivo: Optional[str] = None
    usuario_id: Optional[str] = None
    usuario_nombre: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "momentos_taboada_stock_movimientos"
        indexes = [
            "tenant_id",
            "premio_id",
            "sucursal_destino_id",
            "tipo",
            "created_at",
            [("tenant_id", 1), ("created_at", -1)],
        ]


class ConfiguracionCampanaTaboada(Document):
    """
    Configuración y estado de activación de la campaña Momentos Taboada para el tenant.
    Permite que la administración prepare stock, premios y reglas antes de hacerla pública
    para cajeros y clientes.
    """
    tenant_id: str
    activa: bool = False
    mensaje_inactivo: str = "La campaña Momentos Taboada se encuentra en preparación por administración."
    fecha_activacion: Optional[datetime] = None
    activado_por_usuario: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "momentos_taboada_configuracion"
        indexes = [
            "tenant_id",
            [("tenant_id", 1)],
        ]
