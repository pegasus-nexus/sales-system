import logging
from typing import Any

import httpx

from app.infrastructure.core.config import settings
from app.infrastructure.monitoring.telegram_notifier import IAlertNotifier

logger = logging.getLogger("system.monitor.discord")


class DiscordNotifierAdapter(IAlertNotifier):
    """
    Adaptador para despacho de alertas a través de Discord Webhooks.
    Seguridad estricta: Cero URLs hardcodeadas. Lee exclusivamente de `settings.DISCORD_WEBHOOK_URL`.
    """

    def __init__(self, webhook_url: str | None = None):
        self._webhook_url = webhook_url or settings.DISCORD_WEBHOOK_URL

    @property
    def is_configured(self) -> bool:
        return bool(self._webhook_url and self._webhook_url.startswith("https://discord.com/api/webhooks/"))

    async def notify(
        self,
        title: str,
        message: str,
        level: str = "ERROR",
        metadata: dict[str, Any] | None = None,
    ) -> bool:
        if not self.is_configured:
            logger.info("Discord notifier omitting alert: DISCORD_WEBHOOK_URL is not configured.")
            return False

        # Colores embed Discord (Decimal):
        # Rojo: 15158332 (0xE74C3C), Amarillo/Ámbar: 15844367 (0xF1C40F), Verde: 3066993 (0x2ECC71), Azul: 3447003 (0x3498DB)
        color = 15158332 if level in ("CRITICAL", "ERROR") else 3066993 if level == "RECOVERY" else 3447003

        fields = []
        if metadata:
            for k, v in metadata.items():
                fields.append({"name": str(k), "value": str(v), "inline": True})

        payload = {
            "username": "Pegasus Sentinel Monitor",
            "avatar_url": "https://img.icons8.com/fluency/96/server.png",
            "embeds": [
                {
                    "title": title,
                    "description": message,
                    "color": color,
                    "fields": fields,
                    "footer": {"text": f"Pegasus SalesSystem • Nivel: {level}"},
                }
            ],
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(self._webhook_url, json=payload)
                if res.status_code in (200, 204):
                    logger.info("Discord alert dispatched successfully: %s", title)
                    return True
                else:
                    logger.error("Discord webhook returned status %s: %s", res.status_code, res.text)
                    return False
        except Exception as exc:
            logger.error("Failed to dispatch alert to Discord: %s", exc)
            return False
