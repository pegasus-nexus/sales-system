import logging
import math
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException

from app.application.services.whatsapp_service import WhatsAppService
from app.domain.models.tenant import Tenant, WhatsAppSettings
from app.domain.models.user import User
from app.domain.models.whatsapp_log import WhatsAppLog
from app.domain.models.whatsapp_template import WhatsAppTemplate
from app.infrastructure.messaging.factory import MessageProviderFactory

logger = logging.getLogger(__name__)

DEFAULT_TEMPLATES = [
    {
        "nombre": "Ticket de Venta POS",
        "categoria": "POS",
        "mensaje": "Hola {{cliente}}, adjuntamos el comprobante de tu compra por {{total}} en {{empresa}}. ¡Gracias por tu preferencia! Visítanos pronto.",
        "is_default": True
    },
    {
        "nombre": "Recordatorio de Cobro / Deuda",
        "categoria": "CREDITOS",
        "mensaje": "Estimado(a) {{cliente}}, le recordamos cordialmente que tiene un saldo pendiente de {{saldo_pendiente}} con vencimiento. Agradecemos regularizar su pago en caja o mediante nuestro QR bancario.",
        "is_default": True
    },
    {
        "nombre": "Confirmación de Pedido / Delivery",
        "categoria": "PEDIDOS",
        "mensaje": "¡Tu pedido está en preparación! Código: {{pedido}}. En breve nuestro repartidor saldrá hacia tu dirección.",
        "is_default": True
    },
    {
        "nombre": "Agradecimiento y Fidelización",
        "categoria": "MARKETING",
        "mensaje": "¡Gracias por ser parte de {{empresa}}, {{cliente}}! Tienes {{puntos}} puntos acumulados listos para canjear en tu próxima compra.",
        "is_default": True
    }
]


class WhatsAppAppService:
    @staticmethod
    async def get_status(tenant_id: str) -> dict[str, Any]:
        tenant = await Tenant.get(tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant no encontrado")

        settings: WhatsAppSettings = tenant.settings.whatsapp or WhatsAppSettings()

        provider = MessageProviderFactory.create_provider(settings)
        live_status = {"state": "disconnected", "is_authorized": False}
        if provider:
            try:
                live_status = await provider.get_status()
            except Exception as e:
                logger.error(f"Error checking live whatsapp status: {e}")
                live_status = {"state": "error", "error": str(e), "is_authorized": False}

        return {
            "enabled": settings.enabled,
            "provider": settings.provider,
            "instance_id": settings.instance_id,
            "api_token": "***" if settings.api_token else None,
            "default_message": settings.default_message,
            "live_status": live_status
        }

    @staticmethod
    async def update_config(tenant_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        tenant = await Tenant.get(tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant no encontrado")

        current_ws = tenant.settings.whatsapp or WhatsAppSettings()

        if "enabled" in payload and payload["enabled"] is not None:
            current_ws.enabled = bool(payload["enabled"])
        if payload.get("provider"):
            current_ws.provider = str(payload["provider"]).upper()
        if "instance_id" in payload and payload["instance_id"] is not None:
            current_ws.instance_id = str(payload["instance_id"]).strip()
        if payload.get("api_token"):
            current_ws.api_token = str(payload["api_token"]).strip()
        if payload.get("default_message"):
            current_ws.default_message = str(payload["default_message"]).strip()

        tenant.settings.whatsapp = current_ws
        await tenant.save()

        return await WhatsAppAppService.get_status(tenant_id)

    @staticmethod
    async def get_templates(tenant_id: str) -> list[dict[str, Any]]:
        # Auto-seed if none exist for this tenant
        count = await WhatsAppTemplate.find(WhatsAppTemplate.tenant_id == tenant_id).count()
        if count == 0:
            for tpl in DEFAULT_TEMPLATES:
                new_t = WhatsAppTemplate(
                    tenant_id=tenant_id,
                    nombre=tpl["nombre"],
                    categoria=tpl["categoria"],
                    mensaje=tpl["mensaje"],
                    is_default=tpl["is_default"],
                    is_active=True
                )
                await new_t.create()

        templates = await WhatsAppTemplate.find(
            WhatsAppTemplate.tenant_id == tenant_id,
            WhatsAppTemplate.is_active == True
        ).sort("-created_at").to_list()

        return [
            {
                "id": str(t.id),
                "_id": str(t.id),
                "nombre": t.nombre,
                "categoria": t.categoria,
                "mensaje": t.mensaje,
                "is_default": t.is_default,
                "created_at": t.created_at.isoformat(),
            }
            for t in templates
        ]

    @staticmethod
    async def create_template(tenant_id: str, data: dict[str, Any]) -> dict[str, Any]:
        nombre = data.get("nombre", "").strip()
        mensaje = data.get("mensaje", "").strip()
        categoria = data.get("categoria", "POS").strip().upper()

        if not nombre or not mensaje:
            raise HTTPException(status_code=400, detail="Nombre y mensaje son requeridos")

        template = WhatsAppTemplate(
            tenant_id=tenant_id,
            nombre=nombre,
            categoria=categoria,
            mensaje=mensaje,
            is_default=bool(data.get("is_default", False)),
            is_active=True
        )
        await template.create()

        return {
            "id": str(template.id),
            "_id": str(template.id),
            "nombre": template.nombre,
            "categoria": template.categoria,
            "mensaje": template.mensaje,
            "is_default": template.is_default
        }

    @staticmethod
    async def update_template(tenant_id: str, template_id: str, data: dict[str, Any]) -> dict[str, Any]:
        template = await WhatsAppTemplate.get(template_id)
        if not template or template.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Plantilla no encontrada")

        if data.get("nombre"):
            template.nombre = str(data["nombre"]).strip()
        if data.get("categoria"):
            template.categoria = str(data["categoria"]).strip().upper()
        if data.get("mensaje"):
            template.mensaje = str(data["mensaje"]).strip()
        if "is_default" in data and data["is_default"] is not None:
            template.is_default = bool(data["is_default"])

        template.updated_at = datetime.now(UTC)
        await template.save()

        return {
            "id": str(template.id),
            "_id": str(template.id),
            "nombre": template.nombre,
            "categoria": template.categoria,
            "mensaje": template.mensaje,
            "is_default": template.is_default
        }

    @staticmethod
    async def delete_template(tenant_id: str, template_id: str) -> dict[str, str]:
        template = await WhatsAppTemplate.get(template_id)
        if not template or template.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Plantilla no encontrada")

        template.is_active = False
        template.updated_at = datetime.now(UTC)
        await template.save()

        return {"status": "ok", "message": "Plantilla desactivada"}

    @staticmethod
    async def send_message_and_log(
        tenant_id: str,
        current_user: User,
        phone: str,
        message: str,
        origen: str = "DIRECTO",
        cliente_nombre: str | None = None,
        pdf_url: str | None = None,
        variables: dict[str, str] | None = None
    ) -> dict[str, Any]:
        tenant = await Tenant.get(tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant no encontrado")

        settings: WhatsAppSettings = tenant.settings.whatsapp or WhatsAppSettings()

        # Renderizar variables si existen
        rendered_msg = message
        if variables:
            for k, val in variables.items():
                rendered_msg = rendered_msg.replace(f"{{{{{k}}}}}", str(val))
                rendered_msg = rendered_msg.replace(f"{{{k}}}", str(val))

        # Reemplazar variable de empresa por defecto
        rendered_msg = rendered_msg.replace("{{empresa}}", tenant.name or "Pegasus Store")

        # Envío polimórfico
        success = await WhatsAppService.send_message(
            phone=phone,
            message=rendered_msg,
            settings=settings,
            pdf_url=pdf_url
        )

        # Registro en bitácora
        log_entry = WhatsAppLog(
            tenant_id=tenant_id,
            telefono=phone,
            cliente_nombre=cliente_nombre,
            mensaje=rendered_msg,
            origen=origen,
            estado="ENVIADO" if success else "ERROR",
            error_detalle=None if success else "Fallo al enviar mediante el proveedor de mensajería",
            pdf_url=pdf_url,
            usuario_id=str(current_user.id),
            usuario_nombre=current_user.full_name or current_user.username
        )
        await log_entry.create()

        return {
            "success": success,
            "log_id": str(log_entry.id),
            "phone": phone,
            "estado": log_entry.estado,
            "rendered_message": rendered_msg
        }

    @staticmethod
    async def get_logs(
        tenant_id: str,
        page: int = 1,
        limit: int = 30,
        origen: str | None = None,
        estado: str | None = None
    ) -> dict[str, Any]:
        skip = (page - 1) * limit if limit > 0 else 0

        query = WhatsAppLog.find(WhatsAppLog.tenant_id == tenant_id)
        if origen:
            query = query.find(WhatsAppLog.origen == origen)
        if estado:
            query = query.find(WhatsAppLog.estado == estado)

        total = await query.count()
        logs = await query.sort("-created_at").skip(skip).limit(limit).to_list()

        return {
            "items": [
                {
                    "id": str(item.id),
                    "telefono": item.telefono,
                    "cliente_nombre": item.cliente_nombre,
                    "mensaje": item.mensaje,
                    "origen": item.origen,
                    "estado": item.estado,
                    "error_detalle": item.error_detalle,
                    "pdf_url": item.pdf_url,
                    "usuario_nombre": item.usuario_nombre,
                    "created_at": item.created_at.isoformat()
                }
                for item in logs
            ],
            "total": total,
            "page": page,
            "pages": math.ceil(total / limit) if limit > 0 else 1
        }
