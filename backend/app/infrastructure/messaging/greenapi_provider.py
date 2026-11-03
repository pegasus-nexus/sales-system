import logging

import httpx

from app.infrastructure.messaging.base import BaseMessageProvider

logger = logging.getLogger(__name__)


class GreenApiProvider(BaseMessageProvider):
    """
    Concrete Product para integración con Green API (WhatsApp).
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
        chat_id = f"{phone}@c.us"
        url_message = f"https://api.green-api.com/waInstance{self.instance_id}/sendMessage/{self.api_token}"
        url_file = f"https://api.green-api.com/waInstance{self.instance_id}/sendFileByUrl/{self.api_token}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                if pdf_url:
                    payload_file = {
                        "chatId": chat_id,
                        "urlFile": pdf_url,
                        "fileName": "Comprobante_Venta.pdf",
                        "caption": message,
                    }
                    resp = await client.post(url_file, json=payload_file)
                    if resp.status_code == 200:
                        return True
                    logger.error(f"GreenAPI Error sending file: {resp.text}")

                payload_msg = {
                    "chatId": chat_id,
                    "message": message,
                }
                resp = await client.post(url_message, json=payload_msg)
                return resp.status_code == 200
        except Exception as e:
            logger.error(f"GreenAPI Provider Error: {e!s}")
            return False

    async def get_status(self) -> dict:
        url_state = f"https://api.green-api.com/waInstance{self.instance_id}/getStateInstance/{self.api_token}"
        url_qr = f"https://api.green-api.com/waInstance{self.instance_id}/qr/{self.api_token}"
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res_state = await client.get(url_state)
                state = "unknown"
                if res_state.status_code == 200:
                    state_data = res_state.json()
                    state = state_data.get("stateInstance", "unknown")
                
                qr_base64 = None
                if state in ("notAuthorized", "unknown"):
                    res_qr = await client.get(url_qr)
                    if res_qr.status_code == 200:
                        qr_data = res_qr.json()
                        qr_base64 = qr_data.get("message")

                return {
                    "provider": "GREENAPI",
                    "state": state,
                    "is_authorized": state == "authorized",
                    "qr_code": qr_base64
                }
        except Exception as e:
            logger.error(f"GreenAPI get_status error: {e}")
            return {
                "provider": "GREENAPI",
                "state": "error",
                "error": str(e),
                "is_authorized": False
            }
