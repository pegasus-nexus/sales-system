import logging

from app.domain.models.tenant import WhatsAppSettings
from app.infrastructure.messaging.base import BaseMessageProvider
from app.infrastructure.messaging.greenapi_provider import GreenApiProvider
from app.infrastructure.messaging.mock_provider import MockMessageProvider
from app.infrastructure.messaging.ultramsg_provider import UltraMsgProvider

logger = logging.getLogger(__name__)


class MessageProviderFactory:
    """
    Creator en el patrón Factory Method.
    Encapsula la creación del proveedor de mensajería adecuado
    según la configuración de la empresa o tenant (GreenAPI, UltraMsg, Mock, etc.).
    """

    @staticmethod
    def create_provider(
        settings: WhatsAppSettings | None,
    ) -> BaseMessageProvider | None:
        """
        Método Fábrica (Factory Method):
        Instancia y retorna la implementación adecuada de BaseMessageProvider.
        Retorna None si la configuración está deshabilitada o incompleta.
        """
        if not settings or not settings.enabled:
            return None

        provider_name = (settings.provider or "").strip().upper()

        if provider_name == "GREENAPI":
            if not settings.instance_id or not settings.api_token:
                logger.warning("Faltan credenciales para GreenApiProvider.")
                return None
            return GreenApiProvider(
                instance_id=settings.instance_id,
                api_token=settings.api_token,
            )

        if provider_name == "ULTRAMSG":
            if not settings.instance_id or not settings.api_token:
                logger.warning("Faltan credenciales para UltraMsgProvider.")
                return None
            return UltraMsgProvider(
                instance_id=settings.instance_id,
                api_token=settings.api_token,
            )

        if provider_name in ("MOCK", "TEST", "SIMULATOR"):
            return MockMessageProvider(should_succeed=True)

        logger.warning(
            f"Proveedor de mensajería no soportado o desconocido: '{provider_name}'"
        )
        return None
