from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from jwt.exceptions import PyJWTError as JWTError
import bcrypt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from app.domain.models.user import User, UserRole
from app.infrastructure.core.config import settings

# Configuration — override via environment variable in production
SECRET_KEY = settings.JWT_SECRET_KEY or "pegasus-sales-system-default-jwt-secret-key-for-local-dev-and-ci!!"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/token")

CATALOGO_ALLOWED_PREFIXES = (
    "/api/v1/catalogo",
    "/api/v1/upload",
    "/api/v1/users/me",
    "/api/v1/auth/me",
    "/api/v1/auth/change-password",
    "/api/v1/users/ping",
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pw_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    pw_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await User.find_one(User.username == username)
    if user is None:
        raise credentials_exception

    # Heartbeat de actividad (máximo 1 vez cada 60s)
    now = datetime.now(timezone.utc)
    if not user.last_active_at:
        user.last_active_at = now
        await user.save()
    else:
        last = user.last_active_at.replace(tzinfo=timezone.utc) if user.last_active_at.tzinfo is None else user.last_active_at
        if (now - last).total_seconds() > 60:
            user.last_active_at = now
            await user.save()

    return user


async def get_current_active_user(
    request: Request,
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # Aislamiento estricto: Usuarios de Catálogo SOLO tienen acceso al módulo de catálogo y subida de imágenes
    is_catalog_only = (current_user.role == UserRole.CATALOGO_MERCHANT)
    if not is_catalog_only and current_user.tenant_id and current_user.role != UserRole.SUPERADMIN:
        from app.domain.models.tenant import Tenant
        tenant = await Tenant.get(current_user.tenant_id)
        if tenant and tenant.modulos_activos == ["CATALOGO"]:
            is_catalog_only = True
            if current_user.role != UserRole.CATALOGO_MERCHANT:
                current_user.role = UserRole.CATALOGO_MERCHANT
                await current_user.save()

    if is_catalog_only:
        path = request.url.path
        if not any(path.startswith(prefix) for prefix in CATALOGO_ALLOWED_PREFIXES):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso restringido: Tu cuenta es exclusiva del Catálogo Digital y no tiene acceso al sistema ERP."
            )
        
    # Free Trial Validation (14 days hard limit)
    if current_user.tenant_id and current_user.role != UserRole.SUPERADMIN:
        from app.domain.models.tenant import Tenant, PlanType
        tenant = await Tenant.get(current_user.tenant_id)
        if tenant and tenant.plan == PlanType.BASICO:
            now = datetime.now(timezone.utc)
            created_at = tenant.created_at
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
                
            if now > created_at + timedelta(days=14):
                raise HTTPException(
                    status_code=402, 
                    detail="Tu prueba gratuita de 14 días ha expirado. Por favor, actualiza tu plan para continuar."
                )

    return current_user


def require_roles(allowed_roles: list[UserRole]):
    """
    Dependency to protect routes based on UserRole.
    SUPERADMIN always has access.
    """
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles and current_user.role != UserRole.SUPERADMIN:
            raise HTTPException(status_code=403, detail="Operación no permitida para tu rol")
        return current_user
    return role_checker
