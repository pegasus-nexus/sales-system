from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.domain.models.user import User, UserRole
from app.domain.models.web_config import WebConfig, WebReward
from app.infrastructure.auth import get_current_active_user

router = APIRouter()


class WebConfigUpdate(BaseModel):
    hero_subtitle: str | None = None
    hero_title: str | None = None
    hero_description: str | None = None
    hero_bg_cba: str | None = None
    hero_bg_lpz: str | None = None
    featured_products: list[str] | None = None
    club_benefit_product_id: str | None = None
    club_benefit_description: str | None = None
    club_benefit_branch: str | None = None
    club_benefit_valid_until: str | None = None
    rewards: list[WebReward] | None = None


@router.get("/web-config", response_model=WebConfig)
async def get_web_config(current_user: User = Depends(get_current_active_user)):
    """Obtiene la configuración web del tenant actual."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Usuario sin tenant asignado")

    config = await WebConfig.find_one(WebConfig.tenant_id == tenant_id)
    if not config:
        config = WebConfig(tenant_id=tenant_id)
        await config.create()
    return config


@router.put("/web-config", response_model=WebConfig)
async def update_web_config(
    data: WebConfigUpdate,
    current_user: User = Depends(get_current_active_user),
):
    """Actualiza la configuración web del tenant actual."""
    allowed_roles = [
        UserRole.ADMIN_MATRIZ,
        UserRole.ADMIN,
        UserRole.SUPERADMIN,
        UserRole.ADMIN_SUCURSAL,
    ]
    if current_user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="No autorizado")

    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Usuario sin tenant asignado")

    config = await WebConfig.find_one(WebConfig.tenant_id == tenant_id)
    if not config:
        config = WebConfig(tenant_id=tenant_id)
        await config.create()

    update_data = data.dict(exclude_unset=True)

    # REGLA DE INTEGRIDAD DE PREMIOS WEB:
    # 1. Los premios nunca se eliminan físicamente (soft delete con deleted=True).
    # 2. Si ya existía un premio y no se marcó como deleted o toggle is_active,
    #    NO se permite alterar sus campos de contenido (título, descripción, validez)
    #    para evitar discrepancias con clientes que ya lo canjearon.
    # 3. Al preservar la lista, garantizamos que los premios existentes se conserven
    #    y los canjeados no se intercambien por otros IDs.
    if "rewards" in update_data and update_data["rewards"] is not None:
        new_rewards_input: list[dict] = []
        for r in update_data["rewards"]:
            if hasattr(r, "dict"):
                new_rewards_input.append(r.dict())
            elif isinstance(r, dict):
                new_rewards_input.append(r)

        existing_map: dict[str, WebReward] = {r.id: r for r in config.rewards}
        merged_rewards: list[WebReward] = []
        seen_ids: set[str] = set()

        for new_r_dict in new_rewards_input:
            rid = new_r_dict.get("id")
            if not rid:
                continue

            seen_ids.add(rid)
            if rid in existing_map:
                # El premio ya existía previamente.
                # Regla inmutable: conservar datos originales del premio.
                # Solo se permite actualizar is_active y deleted.
                old_r = existing_map[rid]
                is_active = new_r_dict.get("is_active", old_r.is_active)
                deleted = new_r_dict.get("deleted", old_r.deleted)

                preserved_reward = WebReward(
                    id=old_r.id,
                    title=old_r.title,
                    tag=old_r.tag,
                    desc=old_r.desc,
                    img=old_r.img,
                    validity=old_r.validity,
                    validity_days=old_r.validity_days,
                    start_date=old_r.start_date,
                    end_date=old_r.end_date,
                    created_at=old_r.created_at,
                    is_active=is_active,
                    deleted=deleted,
                )
                merged_rewards.append(preserved_reward)
            else:
                # Es un premio nuevo: validar fecha de lanzamiento
                start_date = new_r_dict.get("start_date")
                now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                if start_date and start_date < now_str:
                    raise HTTPException(
                        status_code=400,
                        detail="La fecha de inicio no puede ser anterior a hoy.",
                    )

                v_days = new_r_dict.get("validity_days", 14)
                new_reward = WebReward(
                    id=rid,
                    title=new_r_dict.get("title", ""),
                    tag=new_r_dict.get("tag", "Premio"),
                    desc=new_r_dict.get("desc", ""),
                    img=new_r_dict.get("img", "/img/placeholder.webp"),
                    validity=new_r_dict.get("validity", f"{v_days} días"),
                    validity_days=v_days,
                    start_date=start_date or now_str,
                    end_date=new_r_dict.get("end_date"),
                    created_at=datetime.now(timezone.utc).isoformat(),
                    is_active=new_r_dict.get("is_active", True),
                    deleted=False,
                )
                merged_rewards.append(new_reward)

        # Preservar premios no incluidos como soft-deleted
        for old_id, old_r in existing_map.items():
            if old_id not in seen_ids:
                old_r.deleted = True
                old_r.is_active = False
                merged_rewards.append(old_r)

        config.rewards = merged_rewards
        del update_data["rewards"]

    if update_data:
        for key, value in update_data.items():
            setattr(config, key, value)

    config.updated_at = datetime.now(timezone.utc)
    await config.save()

    return config
