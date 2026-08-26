from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.domain.models.web_config import WebConfig, WebReward
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import get_current_active_user

router = APIRouter()

class WebConfigUpdate(BaseModel):
    hero_subtitle: Optional[str] = None
    hero_title: Optional[str] = None
    hero_description: Optional[str] = None
    hero_bg_cba: Optional[str] = None
    hero_bg_lpz: Optional[str] = None
    featured_products: Optional[list[str]] = None
    club_benefit_product_id: Optional[str] = None
    club_benefit_description: Optional[str] = None
    club_benefit_branch: Optional[str] = None
    club_benefit_valid_until: Optional[str] = None
    rewards: Optional[list[WebReward]] = None

@router.get("/web-config", response_model=WebConfig)
async def get_web_config(current_user: User = Depends(get_current_active_user)):
    """Get the web config for the current tenant. Creates default if none exists."""
    config = await WebConfig.find_one(WebConfig.tenant_id == current_user.tenant_id)
    if not config:
        config = WebConfig(tenant_id=current_user.tenant_id)
        await config.create()
    return config

@router.put("/web-config", response_model=WebConfig)
async def update_web_config(
    data: WebConfigUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update the web config for the current tenant."""
    if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.ADMIN_SUCURSAL]:
        raise HTTPException(status_code=403, detail="Not authorized")

    config = await WebConfig.find_one(WebConfig.tenant_id == current_user.tenant_id)
    if not config:
        config = WebConfig(tenant_id=current_user.tenant_id)
        await config.create()

    update_data = data.dict(exclude_unset=True)
    if update_data:
        for key, value in update_data.items():
            setattr(config, key, value)
        config.updated_at = datetime.now(timezone.utc)
        await config.save()

    return config
