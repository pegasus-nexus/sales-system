import difflib
import math
import re
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.application.services.credito_service import CreditoService
from app.domain.models.base import DecimalMoney
from app.domain.models.cliente import Cliente, TipoCliente
from app.domain.models.credito import (
    CuentaCredito,
    Deuda,
    EstadoCuenta,
    TransaccionCredito,
)
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import get_current_active_user
from app.schemas.credito import (
    AbonoRequestIn,
    ClienteSimilarMatch,
    CrearCuentaCreditoIn,
    CreditoResumenKPIs,
    CuentasCreditoPaginated,
    VerificarSimilarIn,
)

router = APIRouter()


@router.get("/creditos/resumen", response_model=CreditoResumenKPIs)
async def get_creditos_resumen(
    current_user: User = Depends(get_current_active_user),
):
    """
    Retorna métricas ejecutivas de la cartera de créditos:
    - Cartera total por cobrar
    - Total de cuentas activas
    - Cuentas morosas vs al día
    - Recaudación total abonada hoy
    """
    tenant_id = current_user.tenant_id or "default"

    # Consultar cuentas del tenant
    cuentas = await CuentaCredito.find(
        CuentaCredito.tenant_id == tenant_id
    ).to_list()

    total_cartera = Decimal("0")
    cuentas_morosas = 0
    cuentas_al_dia = 0

    for c in cuentas:
        saldo = Decimal(str(c.saldo_total or "0"))
        if saldo > Decimal("0"):
            total_cartera += saldo
        if c.estado_cuenta == EstadoCuenta.MOROSO or saldo > Decimal("0"):
            cuentas_morosas += 1
        else:
            cuentas_al_dia += 1

    # Calcular recaudación de abonos de hoy (00:00 UTC a ahora)
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)

    transacciones_hoy = await TransaccionCredito.find(
        TransaccionCredito.tenant_id == tenant_id,
        TransaccionCredito.tipo == "ABONO",
        TransaccionCredito.anulada == False,  # noqa: E712
        TransaccionCredito.created_at >= today_start,
    ).to_list()

    total_abonado_hoy = sum(float(str(t.monto or 0)) for t in transacciones_hoy)

    return {
        "total_cartera_por_cobrar": float(total_cartera),
        "total_cuentas": len(cuentas),
        "total_cuentas_morosas": cuentas_morosas,
        "total_cuentas_al_dia": cuentas_al_dia,
        "total_abonado_hoy": total_abonado_hoy,
    }


@router.post("/creditos/verificar-similar", response_model=List[ClienteSimilarMatch])
async def verificar_cliente_similar(
    data: VerificarSimilarIn,
    current_user: User = Depends(get_current_active_user),
):
    """
    Algoritmo de Detección de Deudores / Clientes Duplicados o Similares.
    Compara el nombre, NIT o teléfono contra la base de clientes existente
    usando SequenceMatcher de difflib (umbral >= 70% de similitud) y coincidencia exacta de NIT/Teléfono.
    """
    tenant_id = current_user.tenant_id or "default"
    nombre_buscado = (data.nombre or "").strip().upper()
    nit_buscado = (data.nit_ci or "").strip()
    tel_buscado = "".join(filter(str.isdigit, data.telefono or ""))

    if not nombre_buscado and not nit_buscado and not tel_buscado:
        return []

    # Cargar clientes activos del tenant
    clientes = await Cliente.find(
        Cliente.tenant_id == tenant_id,
        Cliente.is_active == True,  # noqa: E712
    ).to_list()

    # Cargar mapa de cuentas de crédito para saber si ya tienen deuda
    cuentas = await CuentaCredito.find(CuentaCredito.tenant_id == tenant_id).to_list()
    cuenta_map = {c.cliente_id: c for c in cuentas}

    matches: List[ClienteSimilarMatch] = []

    for cli in clientes:
        cli_nombre = (cli.nombre or "").strip().upper()
        cli_nit = (cli.nit_ci or "").strip()
        cli_tel = "".join(filter(str.isdigit, cli.telefono or ""))

        # 1. Coincidencia exacta de NIT o Teléfono (Similitud 100%)
        if nit_buscado and cli_nit and nit_buscado == cli_nit:
            score = 1.0
        elif tel_buscado and cli_tel and tel_buscado == cli_tel:
            score = 0.95
        else:
            # 2. Similitud por nombre usando SequenceMatcher
            score = difflib.SequenceMatcher(None, nombre_buscado, cli_nombre).ratio()

            # Caso especial: Si una cadena contiene totalmente a la otra (ej. "JUAN PEREZ" en "JUAN CARLOS PEREZ")
            if nombre_buscado in cli_nombre or cli_nombre in nombre_buscado:
                score = max(score, 0.80)

        # Umbral de advertencia: 70% o superior
        if score >= 0.70:
            cuenta_asoc = cuenta_map.get(str(cli.id))
            matches.append(
                ClienteSimilarMatch(
                    cliente_id=str(cli.id),
                    nombre=cli.nombre,
                    nit_ci=cli.nit_ci,
                    telefono=cli.telefono,
                    score_similitud=round(score, 2),
                    tiene_cuenta_credito=cuenta_asoc is not None,
                    saldo_pendiente=float(str(cuenta_asoc.saldo_total)) if cuenta_asoc else 0.0,
                )
            )

    # Ordenar por mayor score de similitud y mayor deuda
    matches.sort(key=lambda m: (m.score_similitud, m.saldo_pendiente), reverse=True)
    return matches[:8]


@router.post("/creditos/cuentas")
async def crear_o_aperturar_cuenta_credito(
    data: CrearCuentaCreditoIn,
    current_user: User = Depends(get_current_active_user),
):
    """
    Apertura o inicializa una Cuenta de Crédito para un cliente existente o nuevo.
    Si se detectan nombres similares y confirmar_similar es False, detiene la operación con advertencia.
    """
    tenant_id = current_user.tenant_id or "default"

    # Caso 1: Cliente ya existente seleccionado
    if data.cliente_id:
        cliente = await Cliente.get(data.cliente_id)
        if not cliente or cliente.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Cliente no encontrado.")

        # Verificar si ya tiene cuenta
        cuenta_existente = await CuentaCredito.find_one(
            CuentaCredito.tenant_id == tenant_id,
            CuentaCredito.cliente_id == str(cliente.id),
        )
        if cuenta_existente:
            if data.limite_credito is not None:
                cuenta_existente.limite_credito = DecimalMoney(str(data.limite_credito))
                await cuenta_existente.save()
            return {
                "message": "La cuenta de crédito ya existía para este cliente.",
                "cuenta_id": str(cuenta_existente.id),
                "saldo_total": float(str(cuenta_existente.saldo_total)),
            }

        nueva_cuenta = CuentaCredito(
            tenant_id=tenant_id,
            cliente_id=str(cliente.id),
            cliente_nombre=cliente.nombre,
            cliente_nit=cliente.nit_ci,
            cliente_telefono=cliente.telefono,
            saldo_total=DecimalMoney("0"),
            limite_credito=DecimalMoney(str(data.limite_credito)) if data.limite_credito else None,
            estado_cuenta=EstadoCuenta.AL_DIA,
        )
        await nueva_cuenta.insert()
        return {
            "message": "Cuenta de crédito aperturada exitosamente.",
            "cuenta_id": str(nueva_cuenta.id),
            "saldo_total": 0.0,
        }

    # Caso 2: Nuevo cliente desde cero
    if not data.nombre or not data.nombre.strip():
        raise HTTPException(status_code=400, detail="El nombre del cliente es obligatorio.")

    # Validación de similitud antes de crear (si no se confirmó explícitamente)
    if not data.confirmar_similar:
        similares = await verificar_cliente_similar(
            VerificarSimilarIn(nombre=data.nombre, nit_ci=data.nit_ci, telefono=data.telefono),
            current_user,
        )
        if similares:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "CLIENTE_SIMILAR_DETECTADO",
                    "mensaje": f"Se detectaron {len(similares)} cliente(s) con datos similares en el sistema.",
                    "candidatos": [s.dict() for s in similares],
                },
            )

    # Crear cliente en la colección Cliente
    nuevo_cliente = Cliente(
        tenant_id=tenant_id,
        nombre=data.nombre.strip(),
        nit_ci=data.nit_ci.strip() if data.nit_ci else None,
        telefono=data.telefono.strip() if data.telefono else None,
        tipo_cliente=TipoCliente.ACTIVO,
    )
    await nuevo_cliente.create()

    nueva_cuenta = CuentaCredito(
        tenant_id=tenant_id,
        cliente_id=str(nuevo_cliente.id),
        cliente_nombre=nuevo_cliente.nombre,
        cliente_nit=nuevo_cliente.nit_ci,
        cliente_telefono=nuevo_cliente.telefono,
        saldo_total=DecimalMoney("0"),
        limite_credito=DecimalMoney(str(data.limite_credito)) if data.limite_credito else None,
        estado_cuenta=EstadoCuenta.AL_DIA,
    )
    await nueva_cuenta.insert()

    return {
        "message": "Cliente y Cuenta de Crédito creados exitosamente.",
        "cuenta_id": str(nueva_cuenta.id),
        "cliente_id": str(nuevo_cliente.id),
        "saldo_total": 0.0,
    }


@router.get("/creditos", response_model=CuentasCreditoPaginated)
async def get_cuentas_credito(
    q: Optional[str] = None,
    estado: Optional[EstadoCuenta] = None,
    page: int = 1,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
):
    tenant_id = current_user.tenant_id or "default"

    filters = [CuentaCredito.tenant_id == tenant_id]
    if estado:
        filters.append(CuentaCredito.estado_cuenta == estado)

    if q:
        regex = re.compile(f".*{re.escape(q)}.*", re.IGNORECASE)
        filters.append({
            "$or": [
                {"cliente_nombre": regex},
                {"cliente_nit": regex},
                {"cliente_telefono": regex},
            ]
        })

    is_global_admin = current_user.role in [UserRole.SUPERADMIN, UserRole.ADMIN_MATRIZ]

    if not is_global_admin and current_user.sucursal_id:
        cuentas_ids = await Deuda.get_motor_collection().distinct(
            "cuenta_id", {"sucursal_id": current_user.sucursal_id}
        )
        valid_obj_ids = [ObjectId(cid) for cid in cuentas_ids if ObjectId.is_valid(cid)]
        filters.append({"_id": {"$in": valid_obj_ids}})

    query = CuentaCredito.find(*filters)
    total = await query.count()
    skip = (page - 1) * limit
    cuentas = await query.sort(-CuentaCredito.updated_at).skip(skip).limit(limit).to_list()

    result_items = []
    for c in cuentas:
        c_nombre = getattr(c, "cliente_nombre", None)
        c_nit = getattr(c, "cliente_nit", None)
        c_telefono = getattr(c, "cliente_telefono", None)

        if not c_nombre or c_nombre == "Desconocido":
            cli = await Cliente.get(c.cliente_id)
            if cli:
                c_nombre = cli.nombre
                c_nit = cli.nit_ci
                c_telefono = cli.telefono

                c.cliente_nombre = c_nombre
                c.cliente_nit = c_nit
                c.cliente_telefono = c_telefono
                await c.save()

        result_items.append({
            "id": str(c.id),
            "cliente_id": c.cliente_id,
            "saldo_total": float(str(c.saldo_total)),
            "limite_credito": float(str(c.limite_credito)) if c.limite_credito else None,
            "estado_cuenta": c.estado_cuenta.value,
            "created_at": c.created_at.isoformat(),
            "cliente_nombre": c_nombre or "Desconocido",
            "cliente_nit": c_nit,
            "cliente_telefono": c_telefono,
        })

    return {
        "items": result_items,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit) if limit > 0 else 1,
    }


@router.get("/creditos/{cuenta_id}/deudas")
async def get_deudas_por_cuenta(
    cuenta_id: str,
    estado: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
):
    tenant_id = current_user.tenant_id or "default"
    cuenta = await CuentaCredito.get(cuenta_id)
    if not cuenta or cuenta.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    filters = [Deuda.cuenta_id == cuenta_id]
    if estado:
        filters.append(Deuda.estado == estado)

    is_global_admin = current_user.role in [UserRole.SUPERADMIN, UserRole.ADMIN_MATRIZ]
    if not is_global_admin and current_user.sucursal_id:
        filters.append(Deuda.sucursal_id == current_user.sucursal_id)

    deudas = await Deuda.find(*filters).sort(-Deuda.fecha_emision).to_list()

    from app.domain.models.sale import Sale
    sale_ids = [d.sale_id for d in deudas]
    sales = await Sale.find({"_id": {"$in": [ObjectId(sid) for sid in sale_ids if ObjectId.is_valid(sid)]}}).to_list()
    sales_map = {str(s.id): s for s in sales}

    result = []
    for d in deudas:
        sale = sales_map.get(str(d.sale_id))
        numero_ticket = sale.numero_ticket if sale else str(d.sale_id)[-6:].upper()

        resumen_items = "Desconocido"
        if sale and sale.items:
            names = [item.descripcion for item in sale.items]
            if len(names) > 2:
                resumen_items = f"{names[0]}, {names[1]} y {len(names)-2} más"
            else:
                resumen_items = ", ".join(names)

        result.append({
            "id": str(d.id),
            "cuenta_id": str(d.cuenta_id),
            "cliente_id": str(d.cliente_id),
            "sale_id": str(d.sale_id),
            "sale_id_corto": str(d.sale_id)[-6:].upper(),
            "numero_ticket": numero_ticket,
            "resumen_items": resumen_items,
            "monto_original": float(str(d.monto_original)),
            "saldo_pendiente": float(str(d.saldo_pendiente)),
            "fecha_emision": d.fecha_emision.isoformat(),
            "estado": d.estado.value,
        })
    return result


@router.get("/creditos/{cuenta_id}/transacciones")
async def get_transacciones_cuenta(
    cuenta_id: str,
    current_user: User = Depends(get_current_active_user),
):
    tenant_id = current_user.tenant_id or "default"
    cuenta = await CuentaCredito.get(cuenta_id)
    if not cuenta or cuenta.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    filters = [TransaccionCredito.cuenta_id == cuenta_id]

    is_global_admin = current_user.role in [UserRole.SUPERADMIN, UserRole.ADMIN_MATRIZ]
    if not is_global_admin and current_user.sucursal_id:
        filters.append(TransaccionCredito.sucursal_id == current_user.sucursal_id)

    historial = await TransaccionCredito.find(*filters).sort(-TransaccionCredito.created_at).to_list()

    return [
        {
            "id": str(h.id),
            "tipo": h.tipo,
            "monto": float(str(h.monto)),
            "pagos": [p.dict() for p in h.pagos] if h.pagos else [],
            "deudas_afectadas": h.deudas_afectadas,
            "cajero_nombre": h.cajero_nombre,
            "notas": h.notas,
            "anulada": getattr(h, "anulada", False),
            "anulada_por": getattr(h, "anulada_por", None),
            "created_at": h.created_at.isoformat(),
        } for h in historial
    ]


@router.post("/creditos/{cuenta_id}/abonos")
async def registrar_abono_endpoint(
    cuenta_id: str,
    request: AbonoRequestIn,
    current_user: User = Depends(get_current_active_user),
):
    """
    Registra uno o múltiples pagos a la cuenta, amortizando deudas de manera inteligente.
    """
    cuenta_actualizada = await CreditoService.registrar_abono(cuenta_id, request, current_user)

    return {
        "message": "Abono registrado exitosamente.",
        "cuenta_id": str(cuenta_actualizada.id),
        "nuevo_saldo": float(str(cuenta_actualizada.saldo_total)),
    }


@router.post("/creditos/{cuenta_id}/transacciones/{transaccion_id}/anular")
async def anular_abono_endpoint(
    cuenta_id: str,
    transaccion_id: str,
    motivo: str = "Reversión manual",
    current_user: User = Depends(get_current_active_user),
):
    """
    Anula un abono, devolviendo la deuda, actualizando el saldo y registrando el egreso en caja.
    """
    tenant_id = current_user.tenant_id or "default"
    cuenta = await CuentaCredito.get(cuenta_id)
    if not cuenta or cuenta.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    cuenta_actualizada = await CreditoService.anular_abono(transaccion_id, current_user, motivo)

    return {
        "message": "Abono anulado exitosamente.",
        "cuenta_id": str(cuenta_actualizada.id),
        "nuevo_saldo": float(str(cuenta_actualizada.saldo_total)),
    }
