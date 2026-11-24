import logging
from typing import Any

from app.infrastructure.email.base import BaseEmailProvider

logger = logging.getLogger(__name__)


class MockEmailProvider(BaseEmailProvider):
    """
    Adaptador Mock / Simulador para pruebas unitarias, CI/CD y desarrollo local.

    Implementa BaseEmailProvider sin requerir conexión a internet ni claves de API,
    almacenando el historial de correos enviados en memoria para facilitar las aserciones de tests.
    """

    def __init__(self, should_succeed: bool = True):
        self.should_succeed = should_succeed
        self.sent_emails: list[dict[str, Any]] = []

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str | None = None,
        from_email: str | None = None,
    ) -> bool:
        record = {
            "to": to_email,
            "subject": subject,
            "html": html_content,
            "text": text_content,
            "from": from_email or "mock@pegasus.nexus",
        }
        self.sent_emails.append(record)

        if self.should_succeed:
            logger.info(
                f"[MockEmailProvider] [SIMULADO] Correo enviado a: {to_email} | Asunto: '{subject}'"
            )
            return True
        else:
            logger.warning(
                f"[MockEmailProvider] [SIMULADO-FALLO] Simulación de error de envío a: {to_email}"
            )
            return False

    def clear(self):
        """Limpia el buzón simulado en memoria."""
        self.sent_emails.clear()
