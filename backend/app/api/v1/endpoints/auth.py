import re
from typing import Optional
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, field_validator
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import (
    create_access_token,
    verify_password,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_active_user
)
from fastapi import Request
from app.infrastructure.core.rate_limit import limiter
from beanie import PydanticObjectId

router = APIRouter()

# Hash falso pre-generado (bcrypt tarda ~300ms en procesarlo)
DUMMY_HASH = "$2b$12$EP.cEit4Tq3J2kI4kC/uFOq/jN0uC.P0oW.Hl0Qy5W7u3l/L8Q0H2"

@router.post("/token")
@limiter.limit("5/minute")
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    import re
    # Allow login by matching either username or email (case-insensitive)
    user = await User.find_one({
        "$or": [
            {"username": re.compile(f"^{re.escape(form_data.username)}$", re.IGNORECASE)},
            {"email": re.compile(f"^{re.escape(form_data.username)}$", re.IGNORECASE)}
        ]
    })
    
    # Prevenimos el Timing Attack: Siempre evaluamos un hash, exista el usuario o no
    password_valid = verify_password(form_data.password, user.hashed_password if user else DUMMY_HASH)
    
    if not user or not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "role": user.role,
            "tenant_id": user.tenant_id,
            "sucursal_id": user.sucursal_id
        },
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@router.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    user_dict = current_user.model_dump()
    if current_user.tenant_id:
        from app.domain.models.tenant import Tenant
        from beanie import PydanticObjectId
        try:
            tenant = await Tenant.get(PydanticObjectId(current_user.tenant_id))
            if tenant:
                user_dict["configuracion"] = tenant.configuracion
                user_dict["rubro"] = tenant.rubro.value
                user_dict["modulos_activos"] = tenant.modulos_activos
            else:
                user_dict["configuracion"] = {}
                user_dict["rubro"] = "RETAIL"
                user_dict["modulos_activos"] = ["INVENTARIO", "POS", "KARDEX"]
        except Exception:
            user_dict["configuracion"] = {}
            user_dict["rubro"] = "RETAIL"
            user_dict["modulos_activos"] = ["INVENTARIO", "POS", "KARDEX"]
    else:
        user_dict["configuracion"] = {}
        user_dict["rubro"] = "RETAIL"
        user_dict["modulos_activos"] = ["INVENTARIO", "POS", "KARDEX"]
    
    # Enrich sucursal_nombre if available
    if current_user.sucursal_id:
        from app.domain.models.sucursal import Sucursal
        try:
            suc = await Sucursal.get(PydanticObjectId(current_user.sucursal_id)) if PydanticObjectId.is_valid(current_user.sucursal_id) else None
            if not suc:
                suc = await Sucursal.find_one(Sucursal.id == current_user.sucursal_id)
            if suc:
                user_dict["sucursal_nombre"] = suc.nombre
        except Exception:
            pass

    # Auto-asignar permisos a usuario/sucursal de supermercados
    user_ident = f"{current_user.username or ''} {current_user.email or ''} {current_user.full_name or ''} {user_dict.get('sucursal_nombre', '')}".lower()
    is_super = any(term in user_ident for term in ["supermercado", "super", "mercado"])
    if not is_super and current_user.sucursal_id:
        from app.domain.models.sucursal import Sucursal
        from beanie import PydanticObjectId
        try:
            s_obj = await Sucursal.get(PydanticObjectId(current_user.sucursal_id)) if PydanticObjectId.is_valid(current_user.sucursal_id) else None
            if not s_obj:
                s_obj = await Sucursal.find_one(Sucursal.id == current_user.sucursal_id)
            if s_obj and any(term in (s_obj.nombre or "").lower() for term in ["supermercado", "super", "mercado"]):
                is_super = True
                user_dict["sucursal_nombre"] = s_obj.nombre
        except Exception:
            pass

    if is_super:
        perms = set(user_dict.get("permisos_especiales") or [])
        perms.add("INGRESO_HISTORICO_INVENTARIO")
        perms.add("EDITAR_FECHA_VENTA")
        user_dict["permisos_especiales"] = list(perms)
        curr_perms = set(current_user.permisos_especiales or [])
        if not {"INGRESO_HISTORICO_INVENTARIO", "EDITAR_FECHA_VENTA"}.issubset(curr_perms):
            current_user.permisos_especiales = list(curr_perms.union({"INGRESO_HISTORICO_INVENTARIO", "EDITAR_FECHA_VENTA"}))
            await current_user.save()

    # Asegurar que el ID sea string
    user_dict["id"] = str(current_user.id)
    user_dict["_id"] = str(current_user.id)
    return user_dict

@router.post("/impersonate/{tenant_id}")
async def impersonate_tenant(tenant_id: str, current_user: User = Depends(get_current_active_user)):
    """[SUPERADMIN] Logs in as the ADMIN of the target tenant without password."""
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.SUPERADMIN_STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    admin_user = await User.find_one({"tenant_id": tenant_id, "role": UserRole.ADMIN_MATRIZ})
    if not admin_user:
        admin_user = await User.find_one({"tenant_id": tenant_id, "role": "ADMIN"})
        if not admin_user:
            raise HTTPException(status_code=404, detail="No ADMIN found for this tenant")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": admin_user.username,
            "role": admin_user.role,
            "tenant_id": admin_user.tenant_id,
            "sucursal_id": admin_user.sucursal_id
        },
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": admin_user.role}

@router.post("/impersonate/user/{user_id}")
async def impersonate_user(user_id: str, current_user: User = Depends(get_current_active_user)):
    """[ADMIN_MATRIZ] Logs in as a specific user within the same tenant."""
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.SUPERADMIN_STAFF, UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]:
        raise HTTPException(status_code=403, detail="Not authorized to impersonate users")
        
    target_user = await User.get(PydanticObjectId(user_id))
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.SUPERADMIN_STAFF] and target_user.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Cannot impersonate user from another tenant")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": target_user.username,
            "role": target_user.role,
            "tenant_id": target_user.tenant_id,
            "sucursal_id": target_user.sucursal_id
        },
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": target_user.role}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(
        ...,
        min_length=8,
        description="Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    )

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[@$!%*?&#]", v):
            raise ValueError("Password must contain at least one special character (@$!%*?&#)")
        return v


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Allow any active logged-in user to change their own password.
    """
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )
    
    current_user.hashed_password = get_password_hash(data.new_password)
    await current_user.save()
    return {"message": "Contraseña actualizada exitosamente"}


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


@router.put("/users/me/profile")
async def update_my_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Permite al usuario autenticado actualizar su nombre completo y foto de perfil.
    """
    if data.full_name is not None:
        current_user.full_name = data.full_name.strip() or None
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url.strip() or None

    await current_user.save()
    return {
        "message": "Perfil actualizado exitosamente",
        "user": {
            "id": str(current_user.id),
            "username": current_user.username,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
            "avatar_url": current_user.avatar_url,
            "sucursal_id": current_user.sucursal_id,
            "tenant_id": current_user.tenant_id
        }
    }


class LoginBrandingResponse(BaseModel):
    custom_branding: bool = False
    tenant_name: str = "PEGASUS NEXUS"
    tenant_slug: Optional[str] = None
    logo_url: Optional[str] = None
    login_bg_image: Optional[str] = None
    primary_color: str = "#6366f1"
    secondary_color: str = "#06b6d4"
    headline: str = "Potencia tus operaciones retail con velocidad y precisión."
    description: str = "Control total en tiempo real: Punto de venta ágil, trazabilidad exacta de inventarios, reportes inteligentes y cotizaciones B2B unificadas."
    badge_text: str = "Plataforma Segura Multi-Sucursal"


@router.get("/auth/login-branding", response_model=LoginBrandingResponse)
async def get_login_branding(slug: Optional[str] = None, tenant: Optional[str] = None):
    """
    Endpoint público que retorna el branding personalizado de login para un tenant
    según su slug o nombre en URL/subdominio. Si no existe, retorna el branding default.
    """
    target = slug or tenant
    if not target or not target.strip():
        return LoginBrandingResponse()

    target_str = target.strip()
    clean_target = target_str.lower()

    from app.domain.models.tenant import Tenant
    import unicodedata

    # 1. Búsqueda por slug exacto
    tenant_doc = await Tenant.find_one({"slug": clean_target})

    # 2. Búsqueda por nombre insensible a mayúsculas/minúsculas
    if not tenant_doc:
        tenant_doc = await Tenant.find_one({"name": re.compile(f"^{re.escape(target_str)}$", re.IGNORECASE)})

    # 3. Fallback: Búsqueda flexible por nombre slugificado
    if not tenant_doc:
        all_tenants = await Tenant.find().to_list()
        for t in all_tenants:
            norm_name = unicodedata.normalize('NFKD', t.name).encode('ASCII', 'ignore').decode('utf-8').lower()
            slugified = re.sub(r'[^a-z0-9]+', '-', norm_name).strip('-')
            if slugified == clean_target or clean_target in slugified:
                tenant_doc = t
                break

    if not tenant_doc:
        return LoginBrandingResponse()

    effective_slug = tenant_doc.slug
    if not effective_slug and tenant_doc.name:
        norm_name = unicodedata.normalize('NFKD', tenant_doc.name).encode('ASCII', 'ignore').decode('utf-8').lower()
        effective_slug = re.sub(r'[^a-z0-9]+', '-', norm_name).strip('-')

    s = tenant_doc.settings
    return LoginBrandingResponse(
        custom_branding=True,
        tenant_name=tenant_doc.name,
        tenant_slug=effective_slug,
        logo_url=s.logo_base64,
        login_bg_image=s.login_bg_image,
        primary_color=s.login_primary_color or s.brand_color or "#6366f1",
        secondary_color=s.login_secondary_color or "#06b6d4",
        headline=s.login_headline or f"Potencia las operaciones de {tenant_doc.name}",
        description=s.login_description or "Control total en tiempo real: Punto de venta ágil, trazabilidad exacta de inventarios y reportes.",
        badge_text=s.login_badge_text or "Portal Corporativo Multi-Sucursal"
    )
