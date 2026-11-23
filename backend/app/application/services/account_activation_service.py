import hashlib
import logging
import re
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status

from app.domain.models.account_token import AccountToken
from app.domain.models.tenant import Tenant
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.infrastructure.core.config import settings
from app.infrastructure.email.factory import EmailProviderFactory
from app.infrastructure.email.templates import render_activation_email

logger = logging.getLogger(__name__)


def validate_password_complexity(password: str) -> None:
    """Valida requisitos de complejidad de contraseñas de Pegasus."""
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 8 caracteres.",
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe contener al menos una letra mayúscula.",
        )
    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe contener al menos una letra minúscula.",
        )
    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe contener al menos un número.",
        )
    if not re.search(r"[@$!%*?&#]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe contener al menos un carácter especial (@$!%*?&#).",
        )


def validate_password_not_repeated(
    new_password: str,
    current_hashed: str | None = None,
    history_hashes: list[str] | None = None,
) -> None:
    """
    Verifica que la contraseña no sea idéntica a la actual ni se repita
    con ninguna de las contraseñas recientes registradas en el historial.
    """
    if current_hashed and verify_password(new_password, current_hashed):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña no puede ser idéntica a la contraseña actual.",
        )

    if history_hashes:
        for old_hash in history_hashes:
            if verify_password(new_password, old_hash):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Por seguridad, no puedes reutilizar una de tus contraseñas anteriores.",
                )


class AccountActivationService:
    """
    Servicio de Dominio / Aplicación para la gestión de onboarding y activación
    de cuentas mediante enlaces seguros de correo electrónico.
    """

    @classmethod
    async def request_activation(
        cls,
        email: str,
        full_name: str,
        business_name: str | None = None,
        ip_address: str | None = None,
    ) -> dict:
        clean_email = email.strip().lower()
        clean_name = full_name.strip()
        clean_business = business_name.strip() if business_name else ""

        # 1. Verificar si ya existe usuario activo y verificado con este correo
        existing_user = await User.find_one({"email": clean_email})
        if (
            existing_user
            and existing_user.is_active
            and getattr(existing_user, "is_email_verified", False)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una cuenta activa y verificada con este correo electrónico. Inicia sesión directamente.",
            )

        # 2. Generar token criptográfico de alta entropía (32 bytes url-safe)
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

        # 3. Invalidar tokens previos sin usar para este correo
        now = datetime.now(UTC)
        await AccountToken.find(
            {"email": clean_email, "token_type": "ACTIVATION", "used_at": None}
        ).update({"$set": {"used_at": now}})

        # 4. Crear registro del token con expiración configurable
        expire_hours = settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS
        expires_at = now + timedelta(hours=expire_hours)

        token_doc = AccountToken(
            email=clean_email,
            token_hash=token_hash,
            token_type="ACTIVATION",
            user_id=str(existing_user.id) if existing_user else None,
            metadata={
                "full_name": clean_name,
                "business_name": clean_business,
            },
            created_at=now,
            expires_at=expires_at,
            created_by_ip=ip_address,
        )
        await token_doc.insert()

        # 5. Construir URL de activación dinámica sin hardcodear
        frontend_base = settings.FRONTEND_URL.rstrip("/")
        activation_url = f"{frontend_base}/activar-cuenta?token={raw_token}"

        # 6. Renderizar plantilla desacoplada y enviar vía BaseEmailProvider
        html_body, text_body = render_activation_email(
            user_name=clean_name,
            activation_url=activation_url,
            business_name=clean_business,
            expire_hours=expire_hours,
        )

        email_provider = EmailProviderFactory.get_provider()
        subject = "Activa tu cuenta en Pegasus SalesSystem"
        await email_provider.send_email(
            to_email=clean_email,
            subject=subject,
            html_content=html_body,
            text_content=text_body,
        )

        return {
            "status": "success",
            "message": f"Hemos enviado un enlace de activación al correo {clean_email}.",
            "email": clean_email,
        }

    @classmethod
    async def verify_token(cls, raw_token: str) -> dict:
        if not raw_token or not raw_token.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token de activación requerido.",
            )

        token_hash = hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()
        token_doc = await AccountToken.find_one({"token_hash": token_hash})

        if not token_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El enlace de activación es inválido o no existe.",
            )

        if token_doc.used_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este enlace de activación ya fue utilizado previamente.",
            )

        now = datetime.now(UTC)
        expires = token_doc.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=UTC)

        if now >= expires:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El enlace de activación ha expirado. Por favor solicita uno nuevo.",
            )

        return {
            "valid": True,
            "email": token_doc.email,
            "full_name": token_doc.metadata.get("full_name", ""),
            "business_name": token_doc.metadata.get("business_name", ""),
        }

    @classmethod
    async def complete_activation(
        cls,
        raw_token: str,
        password: str,
        password_confirm: str,
    ) -> dict:
        if password != password_confirm:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Las contraseñas no coinciden.",
            )

        validate_password_complexity(password)

        # 1. Validar el token
        token_info = await cls.verify_token(raw_token)
        clean_email = token_info["email"]
        token_hash = hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()
        token_doc = await AccountToken.find_one({"token_hash": token_hash})

        # 2. Localizar o aprovisionar usuario
        user = await User.find_one({"email": clean_email})

        if user:
            # Control estricto de contraseñas repetidas
            validate_password_not_repeated(
                new_password=password,
                current_hashed=user.hashed_password,
                history_hashes=user.password_history,
            )
            # Guardar contraseña actual en historial (máximo 5)
            if user.hashed_password:
                hist = list(user.password_history or [])
                hist.append(user.hashed_password)
                user.password_history = hist[-5:]

            user.hashed_password = get_password_hash(password)
            user.is_email_verified = True
            user.is_active = True
            await user.save()
        else:
            # Aprovisionar nuevo Tenant si se indicó nombre comercial
            business_name = token_doc.metadata.get("business_name") or "Mi Empresa"
            norm_slug = (
                re.sub(r"[^a-z0-9]+", "-", business_name.lower()).strip("-")
                or "empresa"
            )

            tenant = Tenant(
                name=business_name,
                slug=norm_slug,
                modulos_activos=["INVENTARIO", "POS", "KARDEX", "CATALOGO"],
            )
            await tenant.insert()
            tenant_id_str = str(tenant.id)

            # Crear usuario principal ADMIN_MATRIZ
            new_hash = get_password_hash(password)
            username = clean_email.split("@")[0].lower()
            # Asegurar unicidad de username dentro del tenant
            dup = await User.find_one(
                {"tenant_id": tenant_id_str, "username": username}
            )
            if dup:
                username = f"{username}_{secrets.token_hex(2)}"

            user = User(
                username=username,
                email=clean_email,
                hashed_password=new_hash,
                full_name=token_doc.metadata.get("full_name") or username,
                role=UserRole.ADMIN_MATRIZ,
                tenant_id=tenant_id_str,
                is_email_verified=True,
                is_active=True,
                password_history=[],
            )
            await user.insert()

        # 3. Marcar token como utilizado
        token_doc.used_at = datetime.now(UTC)
        token_doc.user_id = str(user.id)
        await token_doc.save()

        # 4. Generar sesión JWT directa para login automático sin fricción
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": user.username,
                "role": user.role,
                "tenant_id": user.tenant_id,
                "sucursal_id": user.sucursal_id,
            },
            expires_delta=access_token_expires,
        )

        return {
            "status": "success",
            "message": "¡Cuenta activada exitosamente!",
            "access_token": access_token,
            "token_type": "bearer",
            "role": user.role,
            "username": user.username,
            "email": user.email,
        }
