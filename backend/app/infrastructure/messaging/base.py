from abc import ABC, abstractmethod


class BaseMessageProvider(ABC):
    """
    Product Interface en el patrón Factory Method.
    Define el contrato que cualquier proveedor de mensajería (WhatsApp, SMS, etc.)
    debe cumplir.
    """

    @abstractmethod
    async def send_message(
        self,
        phone: str,
        message: str,
        pdf_url: str | None = None
    ) -> bool:
        """
        Envía un mensaje de texto o documento al destinatario.
        :param phone: Número de teléfono normalizado con código de país.
        :param message: Texto del mensaje.
        :param pdf_url: Enlace opcional a un archivo/factura PDF.
        :return: True si el envío fue exitoso, False en caso contrario.
        """
        pass
