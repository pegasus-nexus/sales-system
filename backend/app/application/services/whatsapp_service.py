import logging

from app.domain.models.tenant import WhatsAppSettings
from app.infrastructure.messaging.factory import MessageProviderFactory

logger = logging.getLogger(__name__)


class WhatsAppService:
    """
    Servicio de aplicación para envío de notificaciones por WhatsApp.
    Utiliza el Factory Method (`MessageProviderFactory`) para desacoplarse
    de la API del proveedor externo específico.
    """

    @staticmethod
    def normalize_phone(phone: str) -> str:
        """
        Limpia y normaliza el número telefónico asegurando el código de país.
        """
        clean_phone = "".join(filter(str.isdigit, phone))
        # Si tiene 8 dígitos (formato estándar Bolivia), anteponer código 591
        if len(clean_phone) == 8:
            clean_phone = f"591{clean_phone}"
        return clean_phone

    @staticmethod
    async def send_message(
        phone: str,
        message: str,
        settings: WhatsAppSettings,
        pdf_url: str | None = None,
    ) -> bool:
        """
        Punto de entrada de alto nivel: obtiene el proveedor vía la Factory
        y delega el envío polimórfico.
        """
        provider = MessageProviderFactory.create_provider(settings)
        if not provider:
            logger.debug("Envío omitido: no hay un proveedor configurado o habilitado.")
            return False

        clean_phone = WhatsAppService.normalize_phone(phone)
        if not clean_phone:
            logger.warning("No se pudo enviar mensaje: número telefónico inválido.")
            return False

        return await provider.send_message(
            phone=clean_phone,
            message=message,
            pdf_url=pdf_url,
        )
