import os
from collections.abc import Mapping

from pydantic_settings import BaseSettings, SettingsConfigDict

# Llave SOLO para desarrollo local y CI. Es pública (está en el repositorio),
# por lo que jamás debe usarse en un entorno desplegado: ver
# validate_jwt_secret_for_deployment().
DEV_DEFAULT_JWT_SECRET = (
    "pegasus-sales-system-default-jwt-secret-key-for-local-dev-and-ci!!"
)

# Llaves de ejemplo conocidas (docker-compose.yml, .env.example) que tampoco
# pueden usarse fuera de desarrollo.
KNOWN_INSECURE_JWT_SECRETS = frozenset(
    {
        DEV_DEFAULT_JWT_SECRET,
        "supersecretkey_change_me_in_production",
        "tu_secreto_super_seguro",
    }
)

# HS256 necesita al menos 256 bits (32 bytes) de entropía.
MIN_JWT_SECRET_LENGTH = 32


class Settings(BaseSettings):
    DEFAULT_PUBLIC_TENANT_ID: str = "69cd7f0a8f3f6866d4cfbb62"
    PROJECT_NAME: str = "Pegasus SalesSystem API"
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "sales_system_dev"
    JWT_SECRET_KEY: str = DEV_DEFAULT_JWT_SECRET
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    ENVIRONMENT: str = "development"
    SENTRY_DSN: str = ""
    GEMINI_API_KEY: str = ""

    # Business Timezone Config
    BUSINESS_TIMEZONE: str = "America/La_Paz"

    # Cloudinary Integration
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # System Monitor & Multi-channel Alerts (Zero hardcoding)
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""
    DISCORD_WEBHOOK_URL: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    GOOGLE_DRIVE_FOLDER_ID: str = ""
    STATUS_PAGE_PROBE_INTERVAL_SECONDS: int = 60
    GOOGLE_CLIENT_ID: str = (
        "32112312994-ddleo20g3kjtbrjo6s12uetv5iibujfn.apps.googleusercontent.com"
    )

    # Google Wallet Pass Integration
    GOOGLE_WALLET_ISSUER_ID: str = "3388000000023236729"
    GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL: str = (
        "google-wallet-taboada@pegasus-nexus.iam.gserviceaccount.com"
    )
    GOOGLE_WALLET_SERVICE_ACCOUNT_FILE: str = (
        "backend/credentials/google_wallet_service_account.json"
    )
    GOOGLE_WALLET_PRIVATE_KEY: str = ""
    GOOGLE_WALLET_SERVICE_ACCOUNT_JSON: str = ""

    # Email Subsystem (Resend / Mock / SMTP) - Zero hardcoding, DIP compliant
    EMAIL_PROVIDER: str = "mock"  # Options: "resend", "smtp", "mock"
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "Pegasus Nexus <onboarding@resend.dev>"
    EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24

    model_config = SettingsConfigDict(env_file=("backend/.env", ".env"), extra="ignore")


def is_deployed_environment(
    app_settings: Settings, environ: Mapping[str, str] | None = None
) -> bool:
    """
    True si la app corre en un entorno desplegado (no local ni CI).

    Además de ENVIRONMENT=production, se detecta Render por la variable
    RENDER=true que la plataforma define automáticamente, para que olvidar
    ENVIRONMENT en el panel no desactive las validaciones de seguridad.
    """
    env = os.environ if environ is None else environ
    return (
        app_settings.ENVIRONMENT.strip().lower() == "production"
        or env.get("RENDER", "").strip().lower() == "true"
    )


def validate_jwt_secret_for_deployment(
    app_settings: Settings, environ: Mapping[str, str] | None = None
) -> None:
    """
    Impide arrancar en un entorno desplegado con una llave JWT pública o débil.

    Si se usara la llave por defecto del repositorio, cualquiera podría firmar
    tokens válidos para cualquier usuario y tenant.
    """
    if not is_deployed_environment(app_settings, environ):
        return

    secret = (app_settings.JWT_SECRET_KEY or "").strip()
    if secret in KNOWN_INSECURE_JWT_SECRETS:
        raise ValueError(
            "FATAL: JWT_SECRET_KEY no está configurada en el entorno o usa una "
            "llave de ejemplo pública. Define JWT_SECRET_KEY con un valor "
            "aleatorio propio en las variables de entorno del servidor."
        )
    if len(secret) < MIN_JWT_SECRET_LENGTH:
        raise ValueError(
            f"FATAL: JWT_SECRET_KEY es demasiado corta ({len(secret)} caracteres). "
            f"Usa al menos {MIN_JWT_SECRET_LENGTH} caracteres aleatorios."
        )


settings = Settings()
