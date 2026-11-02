import asyncio
import logging
from typing import Any

from app.infrastructure.monitoring.discord_notifier import DiscordNotifierAdapter
from app.infrastructure.monitoring.telegram_notifier import (
    IAlertNotifier,
    TelegramNotifierAdapter,
)

logger = logging.getLogger("system.monitor.composite")


class CompositeAlertNotifier(IAlertNotifier):
    """
    Patrón Composite: Agrupa múltiples notificadores (Discord, Telegram, etc.)
    y despacha alertas concurrentemente a todos los canales configurados.
    """

    def __init__(self, notifiers: list[IAlertNotifier] | None = None):
        self.notifiers = notifiers or [
            DiscordNotifierAdapter(),
            TelegramNotifierAdapter(),
        ]

    @property
    def has_any_channel_configured(self) -> bool:
        return any(getattr(n, "is_configured", False) for n in self.notifiers)

    async def notify(
        self,
        title: str,
        message: str,
        level: str = "ERROR",
        metadata: dict[str, Any] | None = None,
    ) -> bool:
        tasks = [
            n.notify(title=title, message=message, level=level, metadata=metadata)
            for n in self.notifiers
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        # Éxito si al menos un canal entregó la alerta
        return any(r is True for r in results)
