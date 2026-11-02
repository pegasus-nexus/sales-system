import logging
import httpx
from typing import Optional, Dict, Any
from abc import ABC, abstractmethod
from app.infrastructure.core.config import settings

logger = logging.getLogger("system.monitor.telegram")


class IAlertNotifier(ABC):
    """
    Contrato base (Patrón Adapter) para despacho de alertas de infraestructura y observabilidad.
    Permite intercambiar Telegram por Discord, Slack o Webhook sin modificar el dominio.
    """

    @abstractmethod
    async def notify(
        self,
        title: str,
        message: str,
        level: str = "ERROR",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Envía una notificación de alerta al canal configurado."""
        pass


class TelegramNotifierAdapter(IAlertNotifier):
    """
    Adaptador para notificaciones vía Telegram Bot API.
    Seguridad estricta: Cero tokens hardcodeados. Lee exclusivamente de `settings`.
    """

    def __init__(self, bot_token: Optional[str] = None, chat_id: Optional[str] = None):
        self._bot_token = bot_token or settings.TELEGRAM_BOT_TOKEN
        self._chat_id = chat_id or settings.TELEGRAM_CHAT_ID

    @property
    def is_configured(self) -> bool:
        """Indica si las credenciales de Telegram están configuradas en el entorno."""
        return bool(self._bot_token and self._chat_id)

    async def notify(
        self,
        title: str,
        message: str,
        level: str = "ERROR",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        if not self.is_configured:
            logger.info("Telegram notifier omitting alert: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in env.")
            return False

        icon = "🚨" if level == "CRITICAL" else "⚠️" if level == "ERROR" else "✅" if level == "RECOVERY" else "ℹ️"
        
        # Formato Markdown amigable para Telegram
        formatted_text = f"{icon} *{title}*\n\n{message}"
        
        if metadata:
            formatted_text += "\n\n*Detalles técnicos:*"
            for key, val in metadata.items():
                formatted_text += f"\n• *{key}*: `{val}`"

        url = f"https://api.telegram.org/bot{self._bot_token}/sendMessage"
        payload = {
            "chat_id": self._chat_id,
            "text": formatted_text,
            "parse_mode": "Markdown",
            "disable_web_page_preview": True,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    logger.info("Telegram alert dispatched successfully: %s", title)
                    return True
                else:
                    logger.error(
                        "Telegram API responded with error status %s: %s",
                        res.status_code,
                        res.text,
                    )
                    return False
        except Exception as exc:
            logger.error("Failed to dispatch alert to Telegram: %s", exc)
            return False
