import random
import string
from datetime import UTC, datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
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
    short_url: str | None = None
    cliente_nombre: str
    numero_tarjeta: str


@router.post("/generar-pase")
async def generar_pase_google_wallet(
    request: Request,
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

    # URL corta del backend para QR ultra-nítido y WhatsApp sin saturación de caracteres
    base_url = str(request.base_url).rstrip("/")
    if "onrender.com" in base_url and base_url.startswith("http://"):
        base_url = base_url.replace("http://", "https://")
    short_url = f"{base_url}/api/v1/momentos-taboada/google-wallet/p/{numero_tarjeta}"

    # 3. Generar pase firmado JWT con GoogleWalletService
    return GoogleWalletService.generate_save_jwt(
        numero_tarjeta=numero_tarjeta,
        cliente_nombre=cliente_nombre,
        tickets_disponibles=tickets_disponibles,
        total_gastado=total_gastado,
        short_url=short_url,
    )


@router.get("/p/{tarjeta_o_id}", response_class=HTMLResponse)
async def redirect_google_wallet_pass(tarjeta_o_id: str):
    """
    Enlace corto y directo para escanear en QR y compartir en WhatsApp.
    Redirige al enlace oficial firmado de Google Wallet ('Save to Wallet').
    """
    clean_code = tarjeta_o_id.strip()
    if not clean_code:
        raise HTTPException(status_code=400, detail="Tarjeta no especificada")

    # Buscar cliente por número de tarjeta o ID
    cliente = await Cliente.find_one({"numero_tarjeta": clean_code.upper()})
    if not cliente and PydanticObjectId.is_valid(clean_code):
        cliente = await Cliente.get(PydanticObjectId(clean_code))

    cliente_nombre = cliente.nombre if cliente else "Cliente Taboada"
    numero_tarjeta = cliente.numero_tarjeta if cliente else clean_code.upper()
    total_gastado = float(cliente.total_compras or 0.0) if cliente else 0.0

    tickets_disponibles = 0
    if cliente and cliente.tenant_id:
        try:
            cartilla = await MomentosTaboadaService.buscar_cliente_sellos(
                cliente.tenant_id, numero_tarjeta
            )
            balance_info = cartilla.get("balance", {})
            tickets_disponibles = int(balance_info.get("sellos_disponibles", 0))
            total_gastado = (
                float(balance_info.get("total_compras_campana_bs", 0.0))
                or total_gastado
            )
        except Exception:
            pass

    pass_data = GoogleWalletService.generate_save_jwt(
        numero_tarjeta=numero_tarjeta,
        cliente_nombre=cliente_nombre,
        tickets_disponibles=tickets_disponibles,
        total_gastado=total_gastado,
    )
    save_url = pass_data["save_url"]

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Google Wallet - Chocolates Taboada</title>
    <meta http-equiv="refresh" content="0; url={save_url}">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #2D1406;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
            box-sizing: border-box;
        }}
        .card {{
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 24px;
            padding: 32px 24px;
            max-width: 400px;
            width: 100%;
        }}
        .btn {{
            display: inline-block;
            background: #ffffff;
            color: #1a1a1a;
            font-weight: 700;
            padding: 14px 28px;
            border-radius: 999px;
            text-decoration: none;
            margin-top: 20px;
            font-size: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }}
    </style>
</head>
<body>
    <div class="card">
        <h2 style="margin: 0 0 8px 0;">Chocolates Taboada</h2>
        <p style="opacity: 0.8; font-size: 14px; margin: 0 0 20px 0;">Abriendo tu tarjeta en Google Wallet...</p>
        <a class="btn" href="{save_url}">Añadir a Google Wallet</a>
    </div>
    <script>window.location.href = "{save_url}";</script>
</body>
</html>"""
    return HTMLResponse(content=html)


@router.post("/enviar-whatsapp")
async def enviar_pase_whatsapp(
    payload: EnviarWhatsAppWalletRequest,
    current_user: User = Depends(require_roles(CAJERO_ROLES)),
):
    """
    Envía un mensaje de WhatsApp al cliente con el enlace para guardar
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

    enlace = payload.short_url or payload.save_url
    mensaje = (
        f"🍫 *¡Hola, {payload.cliente_nombre}!*\\n\\n"
        f"Te compartimos tu *Tarjeta Digital Taboada*:\\n"
        f"💳 *Nº de Tarjeta:* `{payload.numero_tarjeta}`\\n\\n"
        f"📲 *Guárdala en tu teléfono con Google Wallet:*\\n"
        f"Toca el siguiente enlace para agregar tu tarjeta:\\n"
        f"{enlace}\\n\\n"
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
