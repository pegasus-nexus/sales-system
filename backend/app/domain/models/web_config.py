from datetime import datetime, timezone
from typing import Optional
from beanie import Document
from pydantic import Field, BaseModel

class WebReward(BaseModel):
    id: str
    title: str
    tag: str
    desc: str
    img: str
    validity: str
    is_active: bool = True

class WebConfig(Document):
    tenant_id: str = Field(..., index=True)
    
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
    
    # Dynamic Rewards for Comunidad
    rewards: list[WebReward] = Field(default_factory=list)
    
    # Club Taboada Benefit
    club_benefit_product_id: Optional[str] = None
    club_benefit_description: Optional[str] = None
    club_benefit_branch: Optional[str] = None
    club_benefit_valid_until: Optional[str] = None
    
    # Metadata
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "web_config"
