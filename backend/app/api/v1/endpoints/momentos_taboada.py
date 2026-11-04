from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel

from app.domain.models.user import User, UserRole
from app.domain.models.tenant import Tenant
from app.infrastructure.auth import get_current_active_user, require_roles
from app.application.services.momentos_taboada_service import MomentosTaboadaService

router = APIRouter()


def check_taboada_access(current_user: User, tenant: Optional[Tenant] = None) -> bool:
    """Verifica que el usuario pertenezca a Chocolates Taboada o sea SUPERADMIN."""
    if current_user.role == UserRole.SUPERADMIN:
        return True
    # Validar por tenant o módulo activo
    if tenant:
        if "Taboada" in (tenant.name or "") or "taboada" in (tenant.slug or ""):
            return True
        if "MOMENTOS_TABOADA" in (tenant.modulos_activos or []):
            return True
    return False


async def get_taboada_tenant_id(current_user: User) -> str:
    tenant_id = current_user.tenant_id
    if not tenant_id:
        if current_user.role == UserRole.SUPERADMIN:
            from app.infrastructure.core.config import settings
            return settings.DEFAULT_PUBLIC_TENANT_ID
        raise HTTPException(status_code=403, detail="No tienes contexto de empresa")

    from beanie import PydanticObjectId
    tenant = await Tenant.get(PydanticObjectId(tenant_id)) if PydanticObjectId.is_valid(tenant_id) else None
    if not tenant:
        tenant = await Tenant.find_one(Tenant.name == "Chocolates Taboada")

    if not check_taboada_access(current_user, tenant):
        raise HTTPException(
            status_code=403,
            detail="El módulo 'Momentos Taboada' es exclusivo para Chocolates Taboada.",
        )
    return tenant_id


class StockUpdateRequest(BaseModel):
    sucursal_id: str
    nuevo_stock: int


class CanjeRequest(BaseModel):
    premio_id: str
    sucursal_id: str
    cliente_telefono: str
    cliente_nombre: Optional[str] = "Cliente"
    metodo_pago: str = "EFECTIVO"
    notas: Optional[str] = None


@router.get("/premios")
async def get_premios(
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Retorna los premios oficiales de Momentos Taboada con stock por sucursal."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaService.get_or_seed_premios(tenant_id)


@router.put("/premios/{premio_id}/stock")
async def update_stock(
    premio_id: str,
    payload: StockUpdateRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Actualiza el stock de un premio en una sucursal específica."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaService.update_premio_stock(
        tenant_id=tenant_id,
        premio_id=premio_id,
        sucursal_id=payload.sucursal_id,
        nuevo_stock=payload.nuevo_stock,
    )


@router.get("/cliente-sellos")
async def get_cliente_sellos(
    query: str = Query(..., description="Teléfono o nombre del cliente"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Consulta los sellos acumulados de un cliente según sus compras desde el 1 de noviembre.
    Regla: 1 sello por cada Bs 30 enteros por ticket independiente.
    """
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaService.buscar_cliente_sellos(tenant_id, query)


@router.post("/canjes")
async def registrar_canje(
    payload: CanjeRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Registra un canje de premio, descuenta stock de la sucursal e ingresa copago a la caja chica de promoción."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaService.registrar_canje(
        tenant_id=tenant_id,
        payload=payload.model_dump(),
        current_user=current_user,
    )


@router.get("/canjes")
async def get_historial_canjes(
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Retorna el historial de canjes completados de la campaña."""
    tenant_id = await get_taboada_tenant_id(current_user)
    from app.domain.models.momentos_taboada import CanjeMomentosTaboada
    return await CanjeMomentosTaboada.find(
        CanjeMomentosTaboada.tenant_id == tenant_id
    ).sort("-created_at").limit(100).to_list()


@router.get("/metricas")
async def get_metricas(
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Dashboard ejecutivo de la campaña Momentos Taboada."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaService.get_dashboard_metricas(tenant_id)


@router.get("/caja-chica")
async def get_caja_chica(
    sucursal_id: Optional[str] = Query(None, description="ID de sucursal o TODAS"),
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Retorna los movimientos y saldo de la Caja Chica de la Promoción (separada de las ventas POS)."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaService.get_caja_chica_movimientos(tenant_id, sucursal_id)
