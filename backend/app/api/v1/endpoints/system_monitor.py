from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field

from app.application.services.system_monitor_service import SystemMonitorService
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import require_roles

router = APIRouter(prefix="/system-monitor", tags=["system-monitor"])
monitor_service = SystemMonitorService()


class AdminInviteRequest(BaseModel):
    email: EmailStr


class SetupPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    password: str = Field(..., min_length=8)


class TestTelegramRequest(BaseModel):
    custom_message: str | None = None


@router.get("/status")
async def get_system_status(
    current_user: User = Depends(require_roles([UserRole.SUPERADMIN, UserRole.SUPERADMIN_STAFF])),
) -> dict[str, Any]:
    """Obtiene el estado general de los servicios, uptime de 24h y métricas de latencia."""
    return await monitor_service.get_system_status_summary()


@router.post("/probe-now")
async def trigger_instant_probe(
    current_user: User = Depends(require_roles([UserRole.SUPERADMIN])),
) -> dict[str, Any]:
    """Ejecuta un sondeo en tiempo real de todos los servicios e infraestructura."""
    results = await monitor_service.probe_all_services()
    summary = await monitor_service.get_system_status_summary()
    return {
        "message": f"Sondeo completado con éxito ({len(results)} servicios analizados).",
        "probe_results": results,
        "summary": summary,
    }


@router.get("/history")
async def get_monitoring_history(
    limit: int = 50,
    service_key: str | None = None,
    current_user: User = Depends(require_roles([UserRole.SUPERADMIN, UserRole.SUPERADMIN_STAFF])),
) -> list[dict[str, Any]]:
    """Devuelve el historial cronológico de sondeos para auditoría y visualización."""
    return await monitor_service.get_health_history(limit=limit, service_key=service_key)


@router.post("/export-snapshot")
async def export_snapshot(
    current_user: User = Depends(require_roles([UserRole.SUPERADMIN])),
) -> dict[str, Any]:
    """Genera un snapshot estructurado de diagnóstico para descarga o respaldo en Google Drive."""
    return await monitor_service.export_system_snapshot()


@router.post("/test-alert")
@router.post("/test-telegram")
async def test_alert_notification(
    payload: TestTelegramRequest,
    current_user: User = Depends(require_roles([UserRole.SUPERADMIN])),
) -> dict[str, Any]:
    """Envía una alerta de prueba a los canales activos (Discord / Telegram) para validar la integración."""
    from app.infrastructure.core.config import settings

    has_channel = bool(
        settings.DISCORD_WEBHOOK_URL or (settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_CHAT_ID)
    )
    if not has_channel:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay canales configurados. Define DISCORD_WEBHOOK_URL o TELEGRAM_BOT_TOKEN en las variables de entorno.",
        )

    msg = payload.custom_message or "Esta es una notificación de prueba emitida desde el Panel de Superadmin de Pegasus SaaS."
    ok = await monitor_service.notifier.notify(
        title="🔔 [PEGASUS SAAS] Verificación de Alertas Activa",
        message=msg,
        level="INFO",
        metadata={
            "Ejecutado por": current_user.email or current_user.username,
            "Estado": "Canal verificado y enlazado correctamente",
        },
    )

    if not ok:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Error al despachar el mensaje al canal de alertas. Verifica que la URL del Webhook sea correcta.",
        )

    return {"success": True, "message": "Alerta de prueba despachada exitosamente."}


# =============================================================================
# GESTIÓN SEGURA DE CONTRASEÑA SUPERADMIN (PILOTO ONBOARDING)
# =============================================================================

@router.post("/admin-invite")
async def invite_admin_setup(
    payload: AdminInviteRequest,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.SUPERADMIN])),
) -> dict[str, Any]:
    """Genera un enlace de un solo uso para que un Superadmin cree su contraseña de forma segura."""
    client_ip = request.client.host if request.client else None
    return await monitor_service.generate_admin_setup_token(
        email=payload.email,
        client_ip=client_ip,
    )


@router.post("/setup-password")
async def setup_password_public(
    payload: SetupPasswordRequest,
) -> dict[str, Any]:
    """Endpoint público que recibe el token temporal seguro y define la contraseña del usuario."""
    try:
        return await monitor_service.complete_admin_setup_password(
            raw_token=payload.token,
            new_password=payload.password,
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )
