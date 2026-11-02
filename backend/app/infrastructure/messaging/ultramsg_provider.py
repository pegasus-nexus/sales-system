import logging

import httpx

from app.infrastructure.messaging.base import BaseMessageProvider

logger = logging.getLogger(__name__)


class UltraMsgProvider(BaseMessageProvider):
    """
    Concrete Product para integración con UltraMsg (WhatsApp).
    """

    def __init__(self, instance_id: str, api_token: str):
        self.instance_id = instance_id
        self.api_token = api_token

    async def send_message(
        self,
        phone: str,
        message: str,
        pdf_url: str | None = None
    ) -> bool:
        url_message = f"https://api.ultramsg.com/{self.instance_id}/messages/chat"
        url_document = f"https://api.ultramsg.com/{self.instance_id}/messages/document"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                if pdf_url:
                    payload = {
                        "token": self.api_token,
                        "to": phone,
                        "document": pdf_url,
                        "filename": "Comprobante_Venta.pdf",
                        "caption": message,
                    }
                    resp = await client.post(url_document, data=payload)
                    if resp.status_code == 200:
                        return True

                payload = {
                    "token": self.api_token,
                    "to": phone,
                    "body": message,
                }
                resp = await client.post(url_message, data=payload)
                return resp.status_code == 200
        except Exception as e:
            logger.error(f"UltraMsg Provider Error: {e!s}")
            return False
