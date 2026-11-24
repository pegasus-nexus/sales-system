from abc import ABC, abstractmethod


class BaseEmailProvider(ABC):
    """
    Contrato base / Interfaz del subsistema de mensajería electrónica (Email).

    Aplica el principio de Inversión de Dependencias (D de SOLID):
    Los módulos de negocio dependen exclusivamente de esta abstracción,
    permitiendo intercambiar proveedores (Resend, SendGrid, Brevo, AWS SES, SMTP, Mock)
    sin modificar la lógica de la aplicación.
    """

    @abstractmethod
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str | None = None,
        from_email: str | None = None,
    ) -> bool:
        """
        Envía un correo electrónico genérico.
        :param to_email: Correo electrónico del destinatario.
        :param subject: Asunto del mensaje.
        :param html_content: Cuerpo del correo en formato HTML.
        :param text_content: Alternativa en texto plano para clientes sin soporte HTML.
        :param from_email: Remitente opcional (si se omite, usa el default del sistema).
        :return: True si el envío fue aceptado por el proveedor, False en caso contrario.
        """
        pass
