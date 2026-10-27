import logging

from app.infrastructure.messaging.base import BaseMessageProvider

logger = logging.getLogger(__name__)


class MockMessageProvider(BaseMessageProvider):
    """
    Concrete Product simulado para pruebas locales y staging.
    No realiza llamadas de red externas.
    """

    def __init__(self, should_succeed: bool = True):
        self.should_succeed = should_succeed
        self.sent_messages: list[dict] = []

    async def send_message(
        self,
        phone: str,
        message: str,
        pdf_url: str | None = None,
    ) -> bool:
        if self.should_succeed:
            record = {
                "phone": phone,
                "message": message,
                "pdf_url": pdf_url,
            }
            self.sent_messages.append(record)
            logger.info(
                f"[MOCK_MESSAGING] Enviado a {phone}: {message[:40]}..."
            )
            return True
        logger.warning(
            f"[MOCK_MESSAGING] Fallo intencional enviando mensaje a {phone}"
        )
        return False
