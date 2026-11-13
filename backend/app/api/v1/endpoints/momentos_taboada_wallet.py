import random
import string
from datetime import UTC, datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.application.services.google_wallet_service import GoogleWalletService
from app.application.services.momentos_taboada_participantes_service import (
    MomentosTaboadaParticipantesService,
)
from app.application.services.momentos_taboada_service import MomentosTaboadaService
from app.application.services.whatsapp_service import WhatsAppService
from app.domain.models.cliente import Cliente
from app.domain.models.tenant import Tenant
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import require_roles

router = APIRouter()

CAJERO_ROLES = [
    UserRole.CAJERO,
    UserRole.VENDEDOR,
    UserRole.SUPERVISOR,
    UserRole.ADMIN_SUCURSAL,
    UserRole.ADMIN_MATRIZ,
    UserRole.ADMIN,
    UserRole.SUPERADMIN,
]


async def _get_taboada_tenant_id(current_user: User) -> str:
    from app.api.v1.endpoints.momentos_taboada import get_taboada_tenant_id

    return await get_taboada_tenant_id(current_user)


class GoogleWalletPassRequest(BaseModel):
    telefono: str | None = None
    numero_tarjeta: str | None = None
    cliente_id: str | None = None
    nombre: str | None = None


class EnviarWhatsAppWalletRequest(BaseModel):
    telefono: str
    save_url: str
    cliente_nombre: str
    numero_tarjeta: str


@router.post("/generar-pase")
async def generar_pase_google_wallet(
    payload: GoogleWalletPassRequest,
    current_user: User = Depends(require_roles(CAJERO_ROLES)),
):
    """
    Genera el enlace firmado oficial de Google Wallet ('Save to Wallet')
    con código de barras CODE_128 y balance de tickets para la Tarjeta Taboada.
    Permite emitir la tarjeta a CUALQUIER cliente del sistema.
    """
    tenant_id = await _get_taboada_tenant_id(current_user)
    query = (
        payload.numero_tarjeta or payload.telefono or payload.cliente_id or ""
    ).strip()
    if not query:
        raise HTTPException(
            status_code=400,
            detail="Se requiere número de tarjeta, teléfono o ID del cliente para generar el pase.",
        )

    # 1. Buscar cliente directamente en la colección de Clientes
    cliente: Cliente | None = None
    if payload.cliente_id and PydanticObjectId.is_valid(payload.cliente_id):
        cliente = await Cliente.get(PydanticObjectId(payload.cliente_id))
        if cliente and cliente.tenant_id != tenant_id:
            cliente = None

    if not cliente and payload.numero_tarjeta:
        cliente = await Cliente.find_one({
            "tenant_id": tenant_id,
            "numero_tarjeta": payload.numero_tarjeta.strip().upper(),
        })

    if not cliente and payload.telefono:
        cliente = await Cliente.find_one({
            "tenant_id": tenant_id,
            "telefono": payload.telefono.strip(),
        })

    # Si se encontró el cliente en la base general de clientes
    if cliente:
        if not cliente.numero_tarjeta:
            # Auto-asignar número de Tarjeta Taboada si aún no tiene
            codigo_nuevo = f"TAB-{''.join(random.choices(string.digits, k=6))}"
            cliente.numero_tarjeta = codigo_nuevo
            cliente.is_miembro_comunidad = True
            if not cliente.fecha_afiliacion:
                cliente.fecha_afiliacion = datetime.now(UTC)
            await cliente.save()

        numero_tarjeta = cliente.numero_tarjeta
        cliente_nombre = cliente.nombre or payload.nombre or "Cliente Taboada"
        telefono = cliente.telefono or payload.telefono

        # Consultar balance si tiene compras en la campaña
        try:
            cartilla = await MomentosTaboadaService.buscar_cliente_sellos(
                tenant_id, numero_tarjeta or telefono or str(cliente.id)
            )
            balance_info = cartilla.get("balance", {})
            tickets_disponibles = int(balance_info.get("sellos_disponibles", 0))
            total_gastado = (
                float(balance_info.get("total_compras_campana_bs", 0.0))
                or float(cliente.total_compras or 0.0)
            )
        except Exception:
            tickets_disponibles = 0
            total_gastado = float(cliente.total_compras or 0.0)

    else:
        # 2. Si no existía aún como cliente formal, consultar vía servicio de campaña
        cartilla = await MomentosTaboadaService.buscar_cliente_sellos(tenant_id, query)
        cliente_info = cartilla.get("cliente", {})
        balance_info = cartilla.get("balance", {})

        numero_tarjeta = cliente_info.get("numero_tarjeta")
        cliente_nombre = cliente_info.get("nombre") or payload.nombre or "Cliente Taboada"
        telefono = cliente_info.get("telefono") or payload.telefono

        # Si aún no tiene tarjeta asignada, auto-asignarla
        if not numero_tarjeta and telefono:
            afiliacion = await MomentosTaboadaParticipantesService.afiliar_tarjeta_taboada(
                tenant_id=tenant_id,
                telefono=telefono,
                nombre=cliente_nombre,
            )
            numero_tarjeta = afiliacion.get("numero_tarjeta")

        if not numero_tarjeta:
            raise HTTPException(
                status_code=400,
                detail="No se pudo determinar o asignar un número de Tarjeta Taboada (TAB-XXXXXX).",
            )

        tickets_disponibles = int(balance_info.get("sellos_disponibles", 0))
        total_gastado = float(balance_info.get("total_compras_campana_bs", 0.0))

    # 3. Generar pase firmado JWT con GoogleWalletService
    return GoogleWalletService.generate_save_jwt(
        numero_tarjeta=numero_tarjeta,
        cliente_nombre=cliente_nombre,
        tickets_disponibles=tickets_disponibles,
        total_gastado=total_gastado,
    )


@router.post("/enviar-whatsapp")
async def enviar_pase_whatsapp(
    payload: EnviarWhatsAppWalletRequest,
    current_user: User = Depends(require_roles(CAJERO_ROLES)),
):
    """
    Envía un mensaje de WhatsApp al cliente con el enlace oficial para guardar
    su Tarjeta Taboada en Google Wallet.
    """
    tenant_id = await _get_taboada_tenant_id(current_user)
    tenant = (
        await Tenant.get(PydanticObjectId(tenant_id))
        if PydanticObjectId.is_valid(tenant_id)
        else None
    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")

    mensaje = (
        f"🍫 *¡Hola, {payload.cliente_nombre}!*\\n\\n"
        f"Te compartimos tu *Tarjeta Digital Taboada*:\\n"
        f"💳 *Nº de Tarjeta:* `{payload.numero_tarjeta}`\\n\\n"
        f"📲 *Guárdala en tu teléfono con Google Wallet:*\\n"
        f"Toca el siguiente enlace para agregar tu tarjeta:\\n"
        f"{payload.save_url}\\n\\n"
        f"¡Presenta el código de barras en caja en cada compra para acumular tickets y canjear premios de *Momentos Taboada*! 🎉"
    )

    exito = await WhatsAppService.send_message(
        phone=payload.telefono,
        message=mensaje,
        settings=tenant.whatsapp_settings,
    )

    return {
        "status": "success" if exito else "error",
        "mensaje": (
            "Mensaje enviado por WhatsApp correctamente"
            if exito
            else "No se pudo enviar el mensaje por WhatsApp. Verifica la configuración."
        ),
        "enviado": exito,
    }
