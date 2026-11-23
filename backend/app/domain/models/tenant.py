from datetime import UTC, datetime
from enum import Enum

from beanie import Document
from pydantic import BaseModel, Field


class WhatsAppSettings(BaseModel):
    enabled: bool = False
    provider: str = "GREENAPI"
    instance_id: str | None = None
    api_token: str | None = None
    default_message: str = "Hola {cliente}, adjuntamos el comprobante de tu compra por {currency_symbol} {total}. ¡Gracias por tu preferencia!"

class TenantSettings(BaseModel):
    currency_code: str = "BOB"
    currency_symbol: str = "Bs."
    whatsapp: WhatsAppSettings = Field(default_factory=WhatsAppSettings)
    ticket_footer: str | None = "¡Gracias por su preferencia!"
    report_watermark: str | None = "Sales System • Confidencial"
    logo_base64: str | None = None
    direccion: str | None = None
    telefono: str | None = None
    brand_color: str | None = "#4f46e5"
    margen_distribuidor: float = 0.15  # Default 15% margen
    login_bg_image: str | None = None
    login_primary_color: str | None = "#4f46e5"
    login_secondary_color: str | None = "#06b6d4"
    login_headline: str | None = None
    login_description: str | None = None
    login_badge_text: str | None = None
from .base import SoftDeleteMixin


class PlanType(str, Enum):
    FREE       = "FREE"        # Plan Gratuito (Emprendedor)
    BASICO     = "BASICO"
    PRO        = "PRO"
    ENTERPRISE = "ENTERPRISE"
    ILIMITADO  = "ILIMITADO"  # Plan interno, no se vende — clientes especiales
    PERSONALIZADO = "PERSONALIZADO" # Planes atómicos creados dinámicamente
    # Legacy
    BASIC      = "BASICO"

class RubroEmpresa(str, Enum):
    RETAIL = "RETAIL"
    RESTAURANTE = "RESTAURANTE"
    DARK_KITCHEN = "DARK_KITCHEN"
    CAFETERIA = "CAFETERIA"
    SERVICIOS = "SERVICIOS"

# Default active modules by business segment (rubro)
MODULOS_DEFAULT_POR_RUBRO: dict[str, list[str]] = {
    "RETAIL": [
        "VENTAS", "INVENTARIO", "CAJA", "CLIENTES", "CREDITOS",
        "KARDEX", "REPORTES_BASICOS"
    ],
    "RESTAURANTE": [
        "VENTAS", "INVENTARIO", "CAJA", "CLIENTES",
        "RECETAS", "MESAS", "COMANDAS", "CARTA_DIGITAL",
        "REPORTES_BASICOS"
    ],
    "DARK_KITCHEN": [
        "VENTAS", "INVENTARIO", "RECETAS", "MEAL_PLANS",
        "PRODUCCION", "DESPACHO", "REPORTES_BASICOS"
    ],
    "CAFETERIA": [
        "VENTAS", "INVENTARIO", "CAJA", "RECETAS",
        "REPORTES_BASICOS"
    ],
    "SERVICIOS": [
        "VENTAS", "CAJA", "CLIENTES", "CREDITOS",
        "REPORTES_BASICOS"
    ],
}

class Tenant(Document, SoftDeleteMixin):
    name: str
    slug: str | None = None
    catalog_slug: str | None = None
    has_catalog: bool | None = False
    plan_id: str | None = None          # Ref to plans collection
    plan: PlanType = PlanType.BASICO
    plan_expires_at: datetime | None = None
    settings: TenantSettings = Field(default_factory=TenantSettings)
    configuracion: dict = Field(default_factory=dict)
    rubro: RubroEmpresa = Field(default=RubroEmpresa.RETAIL)
    modulos_activos: list[str] = Field(default_factory=lambda: ["INVENTARIO", "POS", "KARDEX"])
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "tenants"
        indexes = [
            "name",
            "slug",
            "plan_id"
        ]
