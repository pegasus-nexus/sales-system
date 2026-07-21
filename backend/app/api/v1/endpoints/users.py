from typing import List, Optional
import re
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, EmailStr, field_validator
from app.domain.models.user import User, UserRole
from app.domain.models.sucursal import Sucursal, TipoSucursal
from app.infrastructure.auth import get_current_active_user, get_password_hash, require_roles

router = APIRouter()


class CajeroCreate(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(
        ...,
        min_length=8,
        description="Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    )
    full_name: str
    role: Optional[str] = "CAJERO"
    # NOTE: sucursal_id is intentionally NOT here — it is extracted from the JWT token

    @field_validator("password")
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

class EmployeeUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[@$!%*?&#]", v):
            raise ValueError("Password must contain at least one special character (@$!%*?&#)")
        return v



from datetime import datetime, timezone

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: UserRole
    tenant_id: Optional[str] = None
    sucursal_id: Optional[str] = None
    is_active: bool = True
    last_active_at: Optional[datetime] = None
    is_online: bool = False
    last_active_text: str = "Desconectado"
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


def format_user_response(user: User) -> dict:
    now = datetime.now(timezone.utc)
    last_active = user.last_active_at

    is_online = False
    last_active_text = "Desconectado"

    if last_active:
        if last_active.tzinfo is None:
            last_active = last_active.replace(tzinfo=timezone.utc)

        diff_seconds = (now - last_active).total_seconds()
        diff_minutes = int(diff_seconds / 60)

        if diff_seconds <= 180:  # Activo dentro de los últimos 3 minutos
            is_online = True
            last_active_text = "En línea"
        elif diff_minutes < 60:
            last_active_text = f"Hace {diff_minutes} min"
        elif diff_minutes < 1440:
            hours = int(diff_minutes / 60)
            last_active_text = f"Hace {hours}h"
        else:
            days = int(diff_minutes / 1440)
            last_active_text = f"Hace {days}d"

    return {
        "_id": str(user.id),
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "tenant_id": user.tenant_id,
        "sucursal_id": user.sucursal_id,
        "is_active": getattr(user, "is_active", True),
        "last_active_at": user.last_active_at,
        "is_online": is_online,
        "last_active_text": last_active_text,
        "created_at": user.created_at
    }


@router.post("/users/ping")
async def ping_user(current_user: User = Depends(get_current_active_user)):
    """
    Heartbeat de presencia activa en línea.
    """
    now = datetime.now(timezone.utc)
    current_user.last_active_at = now
    await current_user.save()
    return {"status": "ok", "is_online": True, "last_active_at": now}


@router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: User = Depends(get_current_active_user)):
    """
    Returns users scoped to the current user's context with online/offline status.
    """
    if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR, UserRole.VENDEDOR, UserRole.SUPERADMIN, UserRole.CAJERO]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if current_user.role == UserRole.SUPERADMIN:
        users = await User.find(User.role == UserRole.CAJERO).to_list()
        return [format_user_response(u) for u in users]

    staff_roles = [UserRole.CAJERO, UserRole.VENDEDOR, UserRole.ADMIN_SUCURSAL, UserRole.FACTURADOR]

    from beanie.operators import In

    if current_user.role in [UserRole.ADMIN_SUCURSAL, UserRole.SUPERVISOR, UserRole.VENDEDOR, UserRole.CAJERO]:
        users = await User.find(
            User.tenant_id == current_user.tenant_id,
            User.sucursal_id == current_user.sucursal_id,
            In(User.role, staff_roles),
        ).to_list()
        return [format_user_response(u) for u in users]

    users = await User.find(
        User.tenant_id == current_user.tenant_id,
        In(User.role, staff_roles),
    ).to_list()
    return [format_user_response(u) for u in users]


@router.post("/users/employee", response_model=User)
async def create_cajero(
    data: CajeroCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):
    """
    Create a CAJERO user.

    SECURITY RULE: sucursal_id is NEVER accepted from the request body.
    It is always extracted from the authenticated user's JWT context.

    - ADMIN_MATRIZ   → cajero is bound to the matrix (no sucursal).
    """
    if current_user.role == UserRole.ADMIN_SUCURSAL and data.role not in [UserRole.CAJERO, UserRole.VENDEDOR, UserRole.FACTURADOR, UserRole.SUPERVISOR]:
        raise HTTPException(status_code=403, detail="No tienes permisos para asignar ese rol")

    import re
    username_lower = data.username.lower()
    if await User.find_one({"username": re.compile(f"^{username_lower}$", re.IGNORECASE)}):
        raise HTTPException(status_code=400, detail="Username already exists")

    email_lower = data.email.lower()
    if await User.find_one({"email": re.compile(f"^{email_lower}$", re.IGNORECASE)}):
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")

    # Strict injection from JWT — client cannot override this
    sucursal_id = current_user.sucursal_id  # None if ADMIN_MATRIZ (matrix-level)

    # BIZ RULE: If creating a VENDEDOR/SUPERVISOR from Matrix level, they need their own inventory (Virtual Branch).
    # If created from a Branch context, they stay in that branch.
    if data.role in [UserRole.SUPERVISOR, UserRole.VENDEDOR] and not sucursal_id:
        tipo_sucursal = TipoSucursal.SUPERVISOR if data.role == UserRole.SUPERVISOR else TipoSucursal.VENDEDOR
        nombre_prefix = "Supervisor:" if data.role == UserRole.SUPERVISOR else "Vendedor:"
        
        # Create a new independent virtual branch for the mobile worker
        virtual_branch = Sucursal(
            tenant_id=current_user.tenant_id,
            nombre=f"{nombre_prefix} {data.full_name}",
            ciudad="Móvil",
            direccion="Móvil",
            tipo=tipo_sucursal
        )
        await virtual_branch.create()
        sucursal_id = str(virtual_branch.id)
    # else: already inherits current_user.sucursal_id or None
    else:
        # Otherwise (e.g. CAJERO) they inherit the creator's physical branch
        sucursal_id = current_user.sucursal_id

    hashed = get_password_hash(data.password)
    cajero = User(
        username=username_lower,
        email=data.email,
        hashed_password=hashed,
        full_name=data.full_name,
        role=data.role,
        tenant_id=current_user.tenant_id,
        sucursal_id=sucursal_id,  # dynamically assigned
    )
    await cajero.create()
    from app.infrastructure.core.audit import log_audit
    await log_audit(current_user.tenant_id or "default", str(current_user.id), current_user.username, "CREATE_USER", "USER", str(cajero.id), {"role": cajero.role})
    return cajero


# Legacy /employees aliases kept for backward compatibility
@router.get("/employees", response_model=List[User])
async def get_employees(current_user: User = Depends(get_current_active_user)):
    return await get_users(current_user)


@router.post("/employees", response_model=User)
async def create_employee(data: CajeroCreate, current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))):
    return await create_cajero(data, current_user)

@router.put("/users/{user_id}", response_model=User)
async def update_employee(
    user_id: str,
    data: EmployeeUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):
        
    from beanie import PydanticObjectId
    target_user = await User.get(PydanticObjectId(user_id))
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if current_user.role != UserRole.SUPERADMIN and target_user.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if current_user.role == UserRole.ADMIN_SUCURSAL:
        if target_user.sucursal_id != current_user.sucursal_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if data.role is not None and data.role not in [UserRole.CAJERO, UserRole.VENDEDOR, UserRole.FACTURADOR, UserRole.SUPERVISOR]:
            raise HTTPException(status_code=403, detail="No tienes permisos para asignar ese rol")

    import re
    if data.username is not None:
        username_lower = data.username.lower()
        if username_lower != target_user.username:
            if await User.find_one({"username": re.compile(f"^{username_lower}$", re.IGNORECASE)}):
                raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
            target_user.username = username_lower

    if data.email is not None:
        email_lower = data.email.lower()
        if email_lower != target_user.email:
            if await User.find_one({"email": re.compile(f"^{email_lower}$", re.IGNORECASE)}):
                raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")
            target_user.email = email_lower

    if data.full_name is not None:
        target_user.full_name = data.full_name
    if data.role is not None:
        target_user.role = data.role
    if data.password:
        target_user.hashed_password = get_password_hash(data.password)
        
    await target_user.save()
    from app.infrastructure.core.audit import log_audit
    await log_audit(current_user.tenant_id or "default", str(current_user.id), current_user.username, "UPDATE_USER", "USER", str(target_user.id), {"role": target_user.role})
    return target_user

@router.patch("/users/{user_id}/status")
async def toggle_employee_status(
    user_id: str,
    is_active: bool,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
):
        
    from beanie import PydanticObjectId
    from datetime import datetime
    target_user = await User.get(PydanticObjectId(user_id))
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if current_user.role != UserRole.SUPERADMIN and target_user.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if current_user.role == UserRole.ADMIN_SUCURSAL and target_user.sucursal_id != current_user.sucursal_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if str(target_user.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propio usuario")
        
    target_user.is_active = is_active
    target_user.deleted_at = None if is_active else datetime.utcnow()
    await target_user.save()
    from app.infrastructure.core.audit import log_audit
    action = "ACTIVATE_USER" if is_active else "DEACTIVATE_USER"
    await log_audit(current_user.tenant_id or "default", str(current_user.id), current_user.username, action, "USER", str(target_user.id), {})
    return {"message": "Estado actualizado", "is_active": is_active}
