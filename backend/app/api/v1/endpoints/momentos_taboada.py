
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.application.services.momentos_taboada_service import MomentosTaboadaService
from app.application.services.momentos_taboada_participantes_service import MomentosTaboadaParticipantesService
from app.application.services.momentos_taboada_logistica_service import MomentosTaboadaLogisticaService
from app.application.services.momentos_taboada_config_service import MomentosTaboadaConfigService
from app.domain.models.tenant import Tenant
from app.domain.models.user import User, UserRole
from app.infrastructure.auth import get_current_active_user, require_roles

router = APIRouter()

ADMIN_ROLES = [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]
CAJERO_ROLES = [
    UserRole.CAJERO,
    UserRole.VENDEDOR,
    UserRole.SUPERVISOR,
    UserRole.ADMIN_SUCURSAL,
    UserRole.ADMIN_MATRIZ,
    UserRole.ADMIN,
    UserRole.SUPERADMIN,
]


def check_taboada_access(current_user: User, tenant: Tenant | None = None) -> bool:
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
        tenant = await Tenant.find_one({"name": "Chocolates Taboada"})

    if not check_taboada_access(current_user, tenant):
        raise HTTPException(
            status_code=403,
            detail="El módulo 'Momentos Taboada' es exclusivo para Chocolates Taboada.",
        )
    return tenant_id


class StockUpdateRequest(BaseModel):
    sucursal_id: str
    nuevo_stock: int
class PremioCreateRequest(BaseModel):
    nombre: str
    descripcion: str | None = ""
    sellos_requeridos: int = Field(..., ge=1)
    copago_bs: float = Field(..., ge=0.0)
    imagen_url: str | None = None
    codigo: str | None = None
    stock_por_sucursal: dict[str, int] | None = None


class PremioUpdateRequest(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    sellos_requeridos: int | None = Field(None, ge=1)
    copago_bs: float | None = Field(None, ge=0.0)
    imagen_url: str | None = None
    codigo: str | None = None
    stock_por_sucursal: dict[str, int] | None = None
    is_active: bool | None = None



class SurtirStockRequest(BaseModel):
    sucursal_id: str
    cantidad: int = Field(..., ge=1)
    motivo: str | None = None


class TrasladarStockRequest(BaseModel):
    sucursal_origen_id: str
    sucursal_destino_id: str
    cantidad: int = Field(..., ge=1)
    motivo: str | None = None


class EgresoCajaChicaRequest(BaseModel):
    sucursal_id: str
    monto: float = Field(..., gt=0.0)
    metodo_pago: str = "EFECTIVO"
    descripcion: str


class AfiliarTarjetaRequest(BaseModel):
    telefono: str
    nombre: str | None = None


class ToggleCampanaRequest(BaseModel):
    activa: bool
    mensaje_inactivo: str | None = None


class CanjeRequest(BaseModel):
    premio_id: str
    sucursal_id: str
    cliente_telefono: str
    cliente_nombre: str | None = "Cliente"
    metodo_pago: str = "EFECTIVO"
    notas: str | None = None


@router.get("/estado-campana")
async def get_estado_campana(
    current_user: User = Depends(require_roles(CAJERO_ROLES)),
):
    """Retorna si la campaña está activa o en preparación por administración."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaConfigService.get_estado_campana(tenant_id)


@router.put("/activacion")
async def toggle_activacion(
    payload: ToggleCampanaRequest,
    current_user: User = Depends(require_roles(ADMIN_ROLES)),
):
    """Permite al admin de la empresa activar o pausar la campaña para cajeros y clientes."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaConfigService.toggle_activacion_campana(
        tenant_id=tenant_id,
        activa=payload.activa,
        current_user=current_user,
        mensaje_inactivo=payload.mensaje_inactivo,
    )


@router.get("/participantes")
async def get_participantes(
    sucursal_id: str | None = Query(None, description="ID de sucursal o TODAS"),
    search: str | None = Query(None, description="Búsqueda por nombre, celular o tarjeta"),
    current_user: User = Depends(require_roles(CAJERO_ROLES)),
):
    """
    Retorna la vista de Promoción para cajero:
    1. Cuántos participantes hay total
    2. Ticket promedio de la campaña
    3. Total tickets repartidos
    4. Cuántos participantes compraron más de una vez
    5. Tabla de participantes
    """
    tenant_id = await get_taboada_tenant_id(current_user)
    await MomentosTaboadaConfigService.validar_campana_disponible_para_usuario(tenant_id, current_user)
    return await MomentosTaboadaParticipantesService.get_participantes_y_metricas(
        tenant_id=tenant_id,
        sucursal_id=sucursal_id,
        search=search,
    )


@router.post("/afiliar-tarjeta")
async def afiliar_tarjeta(
    payload: AfiliarTarjetaRequest,
    current_user: User = Depends(require_roles(CAJERO_ROLES)),
):
    """Asigna o vincula una Tarjeta Taboada (TAB-XXXXXX) para recaudar datos e incentivar al cliente."""
    tenant_id = await get_taboada_tenant_id(current_user)
    await MomentosTaboadaConfigService.validar_campana_disponible_para_usuario(tenant_id, current_user)
    return await MomentosTaboadaParticipantesService.afiliar_tarjeta_taboada(
        tenant_id=tenant_id,
        telefono=payload.telefono,
        nombre=payload.nombre,
    )


@router.get("/premios")
async def get_premios(
    current_user: User = Depends(require_roles(CAJERO_ROLES))
):
    """Retorna los premios oficiales de Momentos Taboada con stock por sucursal."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaService.get_or_seed_premios(tenant_id)

@router.post("/premios")
async def create_premio(
    payload: PremioCreateRequest,
    current_user: User = Depends(require_roles(ADMIN_ROLES))
):
    """Crea un nuevo premio en la campaña Momentos Taboada."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaService.create_premio(tenant_id, payload.model_dump())


@router.put("/premios/{premio_id}")
async def update_premio(
    premio_id: str,
    payload: PremioUpdateRequest,
    current_user: User = Depends(require_roles(ADMIN_ROLES))
):
    """Edita la información o inventario de un premio existente."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaService.update_premio(tenant_id, premio_id, payload.model_dump(exclude_unset=True))


@router.delete("/premios/{premio_id}")
async def delete_premio(
    premio_id: str,
    current_user: User = Depends(require_roles(ADMIN_ROLES))
):
    """Inactiva (soft delete) un premio de la campaña."""
    tenant_id = await get_taboada_tenant_id(current_user)
    success = await MomentosTaboadaService.delete_premio(tenant_id, premio_id)
    return {"ok": success, "message": "Premio desactivado exitosamente"}



@router.put("/premios/{premio_id}/stock")
async def update_stock(
    premio_id: str,
    payload: StockUpdateRequest,
    current_user: User = Depends(require_roles(ADMIN_ROLES))
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
    await MomentosTaboadaConfigService.validar_campana_disponible_para_usuario(tenant_id, current_user)
    return await MomentosTaboadaService.buscar_cliente_sellos(tenant_id, query)


@router.post("/canjes")
async def registrar_canje(
    payload: CanjeRequest,
    current_user: User = Depends(require_roles(CAJERO_ROLES))
):
    """Registra un canje de premio, descuenta stock de la sucursal e ingresa copago a la caja chica de promoción."""
    tenant_id = await get_taboada_tenant_id(current_user)
    await MomentosTaboadaConfigService.validar_campana_disponible_para_usuario(tenant_id, current_user)
    return await MomentosTaboadaService.registrar_canje(
        tenant_id=tenant_id,
        payload=payload.model_dump(),
        current_user=current_user,
    )


@router.get("/canjes")
async def get_historial_canjes(
    current_user: User = Depends(require_roles(CAJERO_ROLES))
):
    """Retorna el historial de canjes completados de la campaña."""
    tenant_id = await get_taboada_tenant_id(current_user)
    from app.domain.models.momentos_taboada import CanjeMomentosTaboada
    return await CanjeMomentosTaboada.find(
        CanjeMomentosTaboada.tenant_id == tenant_id
    ).sort("-created_at").limit(100).to_list()


@router.get("/metricas")
async def get_metricas(
    current_user: User = Depends(require_roles(ADMIN_ROLES))
):
    """Dashboard ejecutivo de la campaña Momentos Taboada."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaService.get_dashboard_metricas(tenant_id)


@router.get("/caja-chica")
async def get_caja_chica(
    sucursal_id: str | None = Query(None, description="ID de sucursal o TODAS"),
    current_user: User = Depends(require_roles(ADMIN_ROLES))
):
    """Retorna los movimientos y saldo de la Caja Chica de la Promoción (separada de las ventas POS)."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaService.get_caja_chica_movimientos(tenant_id, sucursal_id)


@router.post("/caja-chica/egreso")
async def registrar_egreso_caja_chica(
    payload: EgresoCajaChicaRequest,
    current_user: User = Depends(require_roles(ADMIN_ROLES))
):
    """Registra una salida/gasto del fondo promocional (ej: compra de tazas o empaques)."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaLogisticaService.registrar_egreso_caja_chica(
        tenant_id=tenant_id,
        sucursal_id=payload.sucursal_id,
        monto=payload.monto,
        metodo_pago=payload.metodo_pago,
        descripcion=payload.descripcion,
        current_user=current_user,
    )


@router.post("/premios/{premio_id}/surtir")
async def surtir_stock(
    premio_id: str,
    payload: SurtirStockRequest,
    current_user: User = Depends(require_roles(ADMIN_ROLES))
):
    """Inyecta existencias físicas de un premio en una sucursal con motivo y auditoría."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaLogisticaService.surtir_stock(
        tenant_id=tenant_id,
        premio_id=premio_id,
        sucursal_id=payload.sucursal_id,
        cantidad=payload.cantidad,
        motivo=payload.motivo,
        current_user=current_user,
    )


@router.post("/premios/{premio_id}/trasladar")
async def trasladar_stock(
    premio_id: str,
    payload: TrasladarStockRequest,
    current_user: User = Depends(require_roles(ADMIN_ROLES))
):
    """Traslada unidades físicas de un premio entre dos sucursales."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaLogisticaService.trasladar_stock(
        tenant_id=tenant_id,
        premio_id=premio_id,
        sucursal_origen_id=payload.sucursal_origen_id,
        sucursal_destino_id=payload.sucursal_destino_id,
        cantidad=payload.cantidad,
        motivo=payload.motivo,
        current_user=current_user,
    )


@router.get("/premios/movimientos-stock")
async def get_movimientos_stock(
    premio_id: str | None = Query(None),
    sucursal_id: str | None = Query(None),
    current_user: User = Depends(require_roles(ADMIN_ROLES))
):
    """Retorna el historial inmutable de surtidos y traslados de premios para auditoría."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaLogisticaService.get_movimientos_stock(
        tenant_id=tenant_id,
        premio_id=premio_id,
        sucursal_id=sucursal_id,
    )


@router.get("/premios/resumen-logistico")
async def get_resumen_logistico(
    current_user: User = Depends(require_roles(ADMIN_ROLES))
):
    """Retorna el semáforo y salud de inventario de premios por sucursal con alertas de agotado."""
    tenant_id = await get_taboada_tenant_id(current_user)
    return await MomentosTaboadaLogisticaService.get_resumen_logistico(tenant_id)
