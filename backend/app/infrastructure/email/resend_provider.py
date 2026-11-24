import logging

import httpx

from app.infrastructure.email.base import BaseEmailProvider

logger = logging.getLogger(__name__)


class ResendEmailProvider(BaseEmailProvider):
    """
    Adaptador concreto para la API de Resend (https://resend.com).

    Implementa el contrato BaseEmailProvider utilizando httpx asíncrono para
    no generar acoplamiento a librerías propietarias ni bloquear el event loop.
    """

    RESEND_API_URL = "https://api.resend.com/emails"

    def __init__(self, api_key: str, default_from: str = "onboarding@resend.dev"):
        self.api_key = api_key.strip()
        self.default_from = default_from.strip()

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str | None = None,
        from_email: str | None = None,
    ) -> bool:
        if not self.api_key:
            logger.error("[ResendEmailProvider] No se ha configurado RESEND_API_KEY.")
            return False

        sender = from_email or self.default_from
        payload = {
            "from": sender,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        if text_content:
            payload["text"] = text_content

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.RESEND_API_URL,
                    json=payload,
                    headers=headers,
                )
                if response.status_code in (200, 201):
                    data = response.json()
                    logger.info(
                        f"[ResendEmailProvider] Correo enviado exitosamente a {to_email}. "
                        f"ID: {data.get('id')}"
                    )
                    return True
                else:
                    logger.error(
                        f"[ResendEmailProvider] Error al enviar correo a {to_email}. "
                        f"Status: {response.status_code}, Detalle: {response.text}"
                    )
                    return False
        except Exception as e:
            logger.exception(
                f"[ResendEmailProvider] Excepción al conectar con Resend: {e}"
            )
            return False
