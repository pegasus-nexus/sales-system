from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DEFAULT_PUBLIC_TENANT_ID: str = "69cd7f0a8f3f6866d4cfbb62"
    PROJECT_NAME: str = "Pegasus SalesSystem API"
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "sales_system_dev"
    JWT_SECRET_KEY: str = (
        "pegasus-sales-system-default-jwt-secret-key-for-local-dev-and-ci!!"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    ENVIRONMENT: str = "development"
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

    model_config = SettingsConfigDict(env_file=("backend/.env", ".env"), extra="ignore")


settings = Settings()
