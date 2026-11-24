import logging

from app.infrastructure.core.config import settings
from app.infrastructure.email.base import BaseEmailProvider
from app.infrastructure.email.mock_provider import MockEmailProvider
from app.infrastructure.email.resend_provider import ResendEmailProvider

logger = logging.getLogger(__name__)


class EmailProviderFactory:
    """
    Fábrica (Factory Method) para el subsistema de correo electrónico.

    Resuelve e instancia la implementación adecuada del contrato BaseEmailProvider
    según la configuración de entorno (EMAIL_PROVIDER, RESEND_API_KEY, etc.),
    garantizando el desacoplamiento total de la capa de aplicación.
    """

    _override_provider: BaseEmailProvider | None = None

    @classmethod
    def override_provider(cls, provider: BaseEmailProvider | None):
        """Permite inyectar un proveedor específico durante tests de integración."""
        cls._override_provider = provider

    @classmethod
    def get_provider(cls) -> BaseEmailProvider:
        """
        Retorna la instancia configurada de BaseEmailProvider.
        """
        if cls._override_provider is not None:
            return cls._override_provider

        provider_name = (settings.EMAIL_PROVIDER or "").strip().lower()

        if provider_name == "resend":
            if not settings.RESEND_API_KEY:
                logger.warning(
                    "[EmailProviderFactory] EMAIL_PROVIDER='resend' pero RESEND_API_KEY no está configurada. "
                    "Haciendo fallback a MockEmailProvider."
                )
                return MockEmailProvider(should_succeed=True)

            return ResendEmailProvider(
                api_key=settings.RESEND_API_KEY,
                default_from=settings.EMAIL_FROM,
            )

        # Fallback predeterminado para desarrollo local y tests
        return MockEmailProvider(should_succeed=True)
