from datetime import UTC, datetime

from beanie import Document
from pydantic import BaseModel, Field


class WebReward(BaseModel):
    id: str
    title: str
    tag: str = 'Premio'
    desc: str
    img: str
    validity: str = ''
    validity_days: int = 14
    start_date: str | None = None  # Formato YYYY-MM-DD (Fecha de lanzamiento)
    end_date: str | None = None    # Formato YYYY-MM-DD (Fecha de finalización opcional)
    created_at: str | None = None  # ISO timestamp de creación
    is_active: bool = True
    deleted: bool = False

class WebConfig(Document):
    tenant_id: str = Field(...)

    # Hero Texts
    hero_subtitle: str = "DESDE 1948 CREANDO MOMENTOS ESPECIALES"
    hero_title: str = "Hay momentos que merecen un buen chocolate."
    hero_description: str = "Cada ocasión merece un detalle especial. Descubre chocolates elaborados con tradición, elegancia y el auténtico sabor boliviano para regalar, compartir o simplemente darte un gusto."

    # Background Images
    hero_bg_cba: str = "/img/portadataboada.png"
    hero_bg_lpz: str = "/img/portadalapaz.png"

    # Featured Products
    featured_products: list[str] = Field(default_factory=list)

    # Dynamic Rewards for Comunidad
    rewards: list[WebReward] = Field(default_factory=list)

    # Club Taboada Benefit
    club_benefit_product_id: str | None = None
    club_benefit_description: str | None = None
    club_benefit_branch: str | None = None
    club_benefit_valid_until: str | None = None

    # Metadata
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "web_config"
