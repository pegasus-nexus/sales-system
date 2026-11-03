from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.application.services.whatsapp_app_service import WhatsAppAppService
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import get_current_active_user, require_roles

router = APIRouter()


class WhatsAppConfigUpdate(BaseModel):
    enabled: bool | None = None
    provider: str | None = None
    instance_id: str | None = None
    api_token: str | None = None
    default_message: str | None = None


class WhatsAppTemplatePayload(BaseModel):
    nombre: str
    categoria: str = "POS"
    mensaje: str
    is_default: bool = False


class WhatsAppSendPayload(BaseModel):
    phone: str
    message: str
    origen: str = "DIRECTO"
    cliente_nombre: str | None = None
    pdf_url: str | None = None
    variables: dict[str, str] | None = None


@router.get("/status")
async def get_whatsapp_status(
    current_user: User = Depends(get_current_active_user)
):
    """
    Retorna la configuración y el estado de conexión en vivo (autorizado, QR, etc.) de WhatsApp.
    """
    tenant_id = current_user.tenant_id or "default"
    return await WhatsAppAppService.get_status(tenant_id)


@router.post("/config")
async def update_whatsapp_config(
    payload: WhatsAppConfigUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Actualiza credenciales y proveedor (GreenAPI, UltraMsg, Mock) para el tenant.
    """
    tenant_id = current_user.tenant_id or "default"
    return await WhatsAppAppService.update_config(tenant_id, payload.model_dump(exclude_none=True))


@router.get("/templates")
async def get_whatsapp_templates(
    current_user: User = Depends(get_current_active_user)
):
    """
    Retorna la lista de plantillas activas de WhatsApp para el tenant.
    """
    tenant_id = current_user.tenant_id or "default"
    return await WhatsAppAppService.get_templates(tenant_id)


@router.post("/templates")
async def create_whatsapp_template(
    payload: WhatsAppTemplatePayload,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Crea una nueva plantilla de mensaje WhatsApp.
    """
    tenant_id = current_user.tenant_id or "default"
    return await WhatsAppAppService.create_template(tenant_id, payload.model_dump())


@router.put("/templates/{template_id}")
async def update_whatsapp_template(
    template_id: str,
    payload: WhatsAppTemplatePayload,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Actualiza una plantilla existente.
    """
    tenant_id = current_user.tenant_id or "default"
    return await WhatsAppAppService.update_template(tenant_id, template_id, payload.model_dump())


@router.delete("/templates/{template_id}")
async def delete_whatsapp_template(
    template_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Desactiva una plantilla de WhatsApp.
    """
    tenant_id = current_user.tenant_id or "default"
    return await WhatsAppAppService.delete_template(tenant_id, template_id)


@router.post("/send")
async def send_whatsapp_message(
    payload: WhatsAppSendPayload,
    current_user: User = Depends(get_current_active_user)
):
    """
    Envía un mensaje personalizado o basado en plantilla y lo registra en la bitácora.
    """
    tenant_id = current_user.tenant_id or "default"
    return await WhatsAppAppService.send_message_and_log(
        tenant_id=tenant_id,
        current_user=current_user,
        phone=payload.phone,
        message=payload.message,
        origen=payload.origen,
        cliente_nombre=payload.cliente_nombre,
        pdf_url=payload.pdf_url,
        variables=payload.variables
    )


@router.get("/logs")
async def get_whatsapp_logs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=30, ge=1, le=100),
    origen: str | None = Query(default=None),
    estado: str | None = Query(default=None),
    current_user: User = Depends(get_current_active_user)
):
    """
    Historial y auditoría de mensajes enviados por WhatsApp.
    """
    tenant_id = current_user.tenant_id or "default"
    return await WhatsAppAppService.get_logs(
        tenant_id=tenant_id,
        page=page,
        limit=limit,
        origen=origen,
        estado=estado
    )
