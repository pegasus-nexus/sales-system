from datetime import UTC, datetime
from typing import Any, ClassVar

from beanie import Document
from pydantic import EmailStr, Field
from pymongo import IndexModel


class AccountToken(Document):
    """
    Modelo de tokens temporales de un solo uso para activación de cuentas,
    verificación de correo e invitación a usuarios sin contraseña inicial.

    Por seguridad criptográfica, el token en texto plano nunca se guarda en la base
    de datos; solo se almacena su digest SHA-256 (token_hash).
    """

    email: EmailStr
    token_hash: str
    token_type: str = "ACTIVATION"  # "ACTIVATION", "PASSWORD_RESET", "INVITATION"
    tenant_id: str | None = None
    user_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    expires_at: datetime
    used_at: datetime | None = None
    created_by_ip: str | None = None

    class Settings:
        name = "account_tokens"
        indexes: ClassVar[list] = [
            IndexModel([("token_hash", 1)], unique=True),
            IndexModel([("email", 1), ("token_type", 1)]),
            IndexModel(
                [("expires_at", 1)], expireAfterSeconds=604800
            ),  # Auto-limpieza a los 7 días
        ]

    def is_valid(self) -> bool:
        """Verifica si el token no ha sido utilizado y no ha expirado."""
        if self.used_at is not None:
            return False
        now = datetime.now(UTC)
        expires = self.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=UTC)
        return now < expires
