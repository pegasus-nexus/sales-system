"""
Caja endpoints — full cash-drawer session management.

Routes:
  POST   /caja/sesion/abrir            — open a new session
  GET    /caja/sesion/activa           — get the active session for this branch
  POST   /caja/sesion/{id}/cerrar      — close a session with physical count
  GET    /caja/sesion/{id}/resumen     — full day breakdown (for arqueo modal)
  POST   /caja/gastos                  — record a manual expense
  GET    /caja/movimientos             — list movements (today / active session)
  GET    /caja/categorias-gasto        — list expense categories
  POST   /caja/categorias-gasto        — create an expense category
"""
from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException, Request

from app.domain.models.caja import CajaSesion, CajaMovimiento, CajaGastoCategoria, EstadoSesion, SubtipoMovimiento
from app.application.services.caja_totales import calcular_totales, money
from app.domain.models.sale import Sale
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import get_current_active_user

router = APIRouter()


from app.domain.schemas.caja import AbrirCajaIn, CerrarCajaIn, GastoIn, IngresoIn, CategoriaGastoIn, ResumenCaja
from app.utils.errors import CajaErrors

# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _get_active_session(tenant_id: str, sucursal_id: str, cajero_id: str) -> Optional[CajaSesion]:
    return await CajaSesion.find_one(
        CajaSesion.tenant_id   == tenant_id,
        CajaSesion.sucursal_id == sucursal_id,
        CajaSesion.cajero_id   == cajero_id,
        CajaSesion.estado      == EstadoSesion.ABIERTA,
    )


async def _ventas_de_sesion(tenant_id: str, sale_ids: set[str]) -> list[Sale]:
    """Ventas vigentes referenciadas por los movimientos de la(s) sesión(es)."""
    oids = [ObjectId(i) for i in sale_ids if ObjectId.is_valid(i)]
    if not oids:
        return []
    return await Sale.find({"_id": {"$in": oids}, "tenant_id": tenant_id, "anulada": False}).to_list()


# ─── Historial de sesiones ────────────────────────────────────────────────────

@router.get("/sesiones")
async def get_sesiones(
    page: int = 1, 
    page_size: int = 10,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sucursal_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Return sessions with pagination, sucursal filtering and date range."""
    tenant_id   = current_user.tenant_id or "default"
    # Permission check for sucursal filtering
    if current_user.role in [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.ADMIN_MATRIZ]:
        target_sucursal = sucursal_id if sucursal_id and sucursal_id != "all" else None
    else:
        target_sucursal = current_user.sucursal_id

    query_args = [
        CajaSesion.tenant_id == tenant_id
    ]
    if target_sucursal:
        from beanie.operators import Or
        query_args.append(Or(
            CajaSesion.sucursal_id == target_sucursal,
            CajaSesion.sucursal_id == (None if target_sucursal == "CENTRAL" else target_sucursal)
        ))
    
    if start_date and end_date:
        from app.utils.date_utils import get_range_bolivia
        start_dt, end_dt = get_range_bolivia(start_date, end_date)
        query_args.append(CajaSesion.abierta_at >= start_dt)
        query_args.append(CajaSesion.abierta_at <= end_dt)
        
    find_query = CajaSesion.find(*query_args).sort("-abierta_at")
    
    total = await find_query.count()
    
    actual_limit = page_size if page_size > 0 else 10
    skip = (page - 1) * actual_limit
    
    sesiones = await find_query.skip(skip).limit(actual_limit).to_list()

    # ── OPTIMIZACIÓN: Pre-fetch TODOS los movimientos de las sesiones en UNA sola query ──
    sesion_ids = [str(s.id) for s in sesiones]
    all_movs = await CajaMovimiento.find(
        {"tenant_id": tenant_id, "sesion_id": {"$in": sesion_ids}}
    ).to_list() if sesion_ids else []

    movs_by_session: dict[str, list] = defaultdict(list)
    for m in all_movs:
        movs_by_session[m.sesion_id].append(m)

    totales = {str(s.id): calcular_totales(movs_by_session.get(str(s.id), []), s.monto_inicial) for s in sesiones}
    all_sale_ids = set().union(*(t.sale_ids for t in totales.values())) if totales else set()
    sales_by_id = {str(v.id): v for v in await _ventas_de_sesion(tenant_id, all_sale_ids)}

    result = []
    for s in sesiones:
        t = totales[str(s.id)]
        ventas = [sales_by_id[i] for i in t.sale_ids if i in sales_by_id]
        total_descuentos = sum((Decimal(str(v.get_total_descuento())) for v in ventas), Decimal("0"))
        saldo = t.saldo_calculado

        result.append({
            "id":              str(s.id),
            "cajero_name":     s.cajero_name,
            "estado":          s.estado,
            "abierta_at":      s.abierta_at,
            "cerrada_at":      s.cerrada_at,
            "monto_inicial":   money(t.monto_inicial),
            "saldo_calculado": money(saldo),
            "total_efectivo":  money(t.ventas_efectivo),
            "total_ingresos_ef": money(t.ingresos_efectivo),
            "total_cambio":    money(t.cambio),
            "total_gastos":    money(t.gastos),
            "total_ajustes":   money(t.ajustes),
            "total_qr":        money(t.total_qr),
            "total_tarjeta":   money(t.total_tarjeta),
            "total_ventas":    money(t.total_ventas),
            "total_descuentos": money(total_descuentos),
            "num_transacciones": len(ventas),
            "monto_cierre_fisico": float(s.monto_cierre_fisico) if s.monto_cierre_fisico is not None else None,
            "diferencia":      money(Decimal(str(s.monto_cierre_fisico)) - saldo) if s.monto_cierre_fisico is not None else None,
            "notas_cierre":    s.notas_cierre,
        })


    return {
        "items": result,
        "total": total,
        "page": page,
        "page_size": actual_limit
    }



# ─── Sesión ───────────────────────────────────────────────────────────────────

@router.post("/sesion/abrir")
async def abrir_caja(request: Request, body: AbrirCajaIn, current_user: User = Depends(get_current_active_user)):
    """Opens a cash session with ACID transactional integrity."""
    from app.application.services.caja_service import CajaService
    ip = request.client.host if request.client else "Unknown IP"
    ua = request.headers.get("user-agent", "Unknown Device")
    return await CajaService.abrir_caja(body, current_user, ip, ua)


@router.get("/sesiones/abiertas")
async def get_sesiones_abiertas(current_user: User = Depends(get_current_active_user)):
    """Retorna todas las sesiones de caja actualmente ABIERTAS en la sucursal."""
    tenant_id   = current_user.tenant_id or "default"
    sucursal_id = current_user.sucursal_id or "CENTRAL"
    
    sesiones = await CajaSesion.find(
        CajaSesion.tenant_id   == tenant_id,
        CajaSesion.sucursal_id == sucursal_id,
        CajaSesion.estado      == EstadoSesion.ABIERTA,
    ).to_list()
    
    return sesiones

@router.get("/sesion/activa")
async def get_sesion_activa(current_user: User = Depends(get_current_active_user)):
    tenant_id   = current_user.tenant_id or "default"
    sucursal_id = current_user.sucursal_id or "CENTRAL"
    sesion = await _get_active_session(tenant_id, sucursal_id, str(current_user.id))
    if not sesion:
        return None
    return sesion


@router.post("/sesion/{sesion_id}/cerrar")
async def cerrar_caja(sesion_id: str, body: CerrarCajaIn, current_user: User = Depends(get_current_active_user)):
    """Closes an active cash session."""
    from app.application.services.caja_service import CajaService
    return await CajaService.cerrar_caja(sesion_id, body, current_user)


@router.get("/sesion/{sesion_id}/resumen", response_model=ResumenCaja)
async def get_resumen(sesion_id: str, current_user: User = Depends(get_current_active_user)):
    tenant_id = current_user.tenant_id or "default"

    sesion = await CajaSesion.get(sesion_id)
    if not sesion or sesion.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Sesi\u00f3n no encontrada.")

    # ── Cash movements ────────────────────────────────────────────────────────
    movimientos = await CajaMovimiento.find(
        CajaMovimiento.tenant_id == tenant_id,
        CajaMovimiento.sesion_id == sesion_id,
    ).sort("+fecha").to_list()

    t = calcular_totales(movimientos, sesion.monto_inicial)
    sales_in_session = await _ventas_de_sesion(tenant_id, t.sale_ids)
    total_descuentos = sum((Decimal(str(sale.get_total_descuento())) for sale in sales_in_session), Decimal("0"))

    return ResumenCaja(
        sesion_id              = str(sesion.id),
        cajero_name            = sesion.cajero_name,
        abierta_at             = sesion.abierta_at,
        monto_inicial          = money(t.monto_inicial),
        total_efectivo_ventas  = money(t.ventas_efectivo),
        total_cambio           = money(t.cambio),
        total_gastos           = money(t.gastos),
        total_ajustes          = money(t.ajustes),
        saldo_calculado        = money(t.saldo_calculado),
        total_qr               = money(t.total_qr),
        total_tarjeta          = money(t.total_tarjeta),
        total_ventas_general   = money(t.total_ventas),
        total_ingresos_efectivo = money(t.ingresos_efectivo),
        total_ingresos_qr       = money(t.ingresos_qr),
        total_ingresos_tarjeta  = money(t.ingresos_tarjeta),
        total_descuentos       = money(total_descuentos),
        num_transacciones      = len(sales_in_session),
        movimientos            = [m.model_dump(mode="json") for m in movimientos],
    )


# ─── Gastos ───────────────────────────────────────────────────────────────────

@router.post("/gastos")
async def registrar_gasto(body: GastoIn, current_user: User = Depends(get_current_active_user)):
    tenant_id   = current_user.tenant_id or "default"
    sucursal_id = current_user.sucursal_id or "CENTRAL"

    sesion = await _get_active_session(tenant_id, sucursal_id, str(current_user.id))
    if not sesion:
        raise HTTPException(status_code=400, detail=CajaErrors.SIN_SESION_ACTIVA)

    mov = CajaMovimiento(
        tenant_id   = tenant_id,
        sucursal_id = sucursal_id,
        sesion_id   = str(sesion.id),
        cajero_id   = str(current_user.id),
        cajero_name = current_user.full_name or current_user.username,
        subtipo     = SubtipoMovimiento.GASTO,
        tipo        = "EGRESO",
        monto       = float(body.monto),
        descripcion = body.descripcion,
        categoria_id= body.categoria_id,
    )
    await mov.create()
    return mov


# ─── Ingresos Manuales ────────────────────────────────────────────────────────

@router.post("/ingresos")
async def registrar_ingreso(body: IngresoIn, current_user: User = Depends(get_current_active_user)):
    tenant_id   = current_user.tenant_id or "default"
    sucursal_id = current_user.sucursal_id or "CENTRAL"

    sesion = await _get_active_session(tenant_id, sucursal_id, str(current_user.id))
    if not sesion:
        raise HTTPException(status_code=400, detail="No hay una sesión de caja abierta. Abrí la caja primero.")

    subtipo = SubtipoMovimiento.INGRESO_EFECTIVO
    metodo_upper = body.metodo.upper()
    if metodo_upper == "QR":
        subtipo = SubtipoMovimiento.INGRESO_QR
    elif metodo_upper == "TARJETA":
        subtipo = SubtipoMovimiento.INGRESO_TARJETA

    mov = CajaMovimiento(
        tenant_id   = tenant_id,
        sucursal_id = sucursal_id,
        sesion_id   = str(sesion.id),
        cajero_id   = str(current_user.id),
        cajero_name = current_user.full_name or current_user.username,
        subtipo     = subtipo,
        tipo        = "INGRESO",
        monto       = float(body.monto),
        descripcion = body.descripcion,
    )
    await mov.create()
    return mov


# ─── Movimientos ──────────────────────────────────────────────────────────────

@router.get("/movimientos")
async def get_movimientos(current_user: User = Depends(get_current_active_user)):
    tenant_id   = current_user.tenant_id or "default"
    sucursal_id = current_user.sucursal_id or "CENTRAL"

    sesion = await _get_active_session(tenant_id, sucursal_id, str(current_user.id))
    if not sesion:
        return []

    return await CajaMovimiento.find(
        CajaMovimiento.sesion_id == str(sesion.id)
    ).sort("+fecha").to_list()


# ─── Categorías de gasto ──────────────────────────────────────────────────────

@router.get("/categorias-gasto")
async def get_categorias(current_user: User = Depends(get_current_active_user)):
    tenant_id = current_user.tenant_id or "default"
    return await CajaGastoCategoria.find(
        CajaGastoCategoria.tenant_id == tenant_id,
        CajaGastoCategoria.is_active == True
    ).to_list()


@router.post("/categorias-gasto")
async def create_categoria(body: CategoriaGastoIn, current_user: User = Depends(get_current_active_user)):
    tenant_id = current_user.tenant_id or "default"
    cat = CajaGastoCategoria(
        tenant_id   = tenant_id,
        nombre      = body.nombre,
        descripcion = body.descripcion,
        icono       = body.icono or "receipt",
        partida     = body.partida,
        padre_id    = body.padre_id,
    )
    await cat.create()
    return cat


@router.put("/categorias-gasto/{cat_id}")
async def update_categoria(cat_id: str, body: CategoriaGastoIn, current_user: User = Depends(get_current_active_user)):
    if not ObjectId.is_valid(cat_id):
        raise HTTPException(status_code=400, detail="ID de categoría inválido")
    tenant_id = current_user.tenant_id or "default"
    cat = await CajaGastoCategoria.find_one(CajaGastoCategoria.id == ObjectId(cat_id), CajaGastoCategoria.tenant_id == tenant_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    cat.nombre = body.nombre
    cat.descripcion = body.descripcion
    cat.icono = body.icono or cat.icono
    await cat.save()
    return cat


@router.delete("/categorias-gasto/{cat_id}")
async def delete_categoria(cat_id: str, current_user: User = Depends(get_current_active_user)):
    if not ObjectId.is_valid(cat_id):
        raise HTTPException(status_code=400, detail="ID de categoría inválido")
    tenant_id = current_user.tenant_id or "default"
    cat = await CajaGastoCategoria.find_one(CajaGastoCategoria.id == ObjectId(cat_id), CajaGastoCategoria.tenant_id == tenant_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    cat.is_active = False
    cat.deleted_at = datetime.now(timezone.utc)
    await cat.save()
    return {"status": "deleted"}
