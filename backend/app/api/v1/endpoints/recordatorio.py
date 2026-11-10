from fastapi import APIRouter, Depends, Query, status

from app.application.services.recordatorio_service import RecordatorioService
from app.domain.models.user import User
from app.domain.schemas.recordatorio import (
    CategoriaRecordatorioCreate,
    CategoriaRecordatorioResponse,
    RecordatorioCreate,
    RecordatorioEstadoUpdate,
    RecordatorioKPIsResponse,
    RecordatorioResponse,
    RecordatorioUpdate,
)
from app.infrastructure.auth import get_current_active_user
from app.infrastructure.repositories.mongo_recordatorio_repository import (
    MongoRecordatorioRepository,
)

router = APIRouter()


def get_recordatorio_service() -> RecordatorioService:
    return RecordatorioService(repository=MongoRecordatorioRepository())


@router.get("", response_model=list[RecordatorioResponse])
async def list_recordatorios(
    sucursal_id: str | None = Query(
        None, description="Filtrar por sucursal específica"
    ),
    categoria: str | None = Query(None, description="Filtrar por categoría"),
    prioridad: str | None = Query(
        None, description="Filtrar por prioridad (BAJA, MEDIA, ALTA)"
    ),
    estado: str | None = Query(
        None, description="Filtrar por estado (PENDIENTE, EN_SEGUIMIENTO, RESUELTO)"
    ),
    search: str | None = Query(
        None, description="Búsqueda por texto en título o descripción"
    ),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    service: RecordatorioService = Depends(get_recordatorio_service),
):
    """
    Lista los recordatorios e incidencias del tenant con soporte de filtrado multi-criterio.
    """
    return await service.list_recordatorios(
        tenant_id=current_user.tenant_id,
        sucursal_id=sucursal_id,
        categoria=categoria,
        prioridad=prioridad,
        estado=estado,
        search=search,
        limit=limit,
        skip=skip,
    )


@router.get("/kpis", response_model=RecordatorioKPIsResponse)
async def get_recordatorio_kpis(
    sucursal_id: str | None = Query(
        None, description="Filtrar KPIs por sucursal específica"
    ),
    current_user: User = Depends(get_current_active_user),
    service: RecordatorioService = Depends(get_recordatorio_service),
):
    """
    Obtiene el resumen numérico de los 4 KPIs (Total, Pendientes, En Seguimiento, Resueltos).
    """
    return await service.get_kpis(
        tenant_id=current_user.tenant_id,
        sucursal_id=sucursal_id,
    )


@router.get("/categorias", response_model=list[str])
async def list_categorias(
    current_user: User = Depends(get_current_active_user),
    service: RecordatorioService = Depends(get_recordatorio_service),
):
    """
    Retorna la lista de categorías estándar y personalizadas para el tenant.
    """
    return await service.listar_categorias(tenant_id=current_user.tenant_id)


@router.post(
    "/categorias",
    response_model=CategoriaRecordatorioResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_categoria(
    data: CategoriaRecordatorioCreate,
    current_user: User = Depends(get_current_active_user),
    service: RecordatorioService = Depends(get_recordatorio_service),
):
    """
    Registra una nueva categoría personalizada para el tenant.
    """
    nombre_autor = current_user.full_name or current_user.username
    return await service.crear_categoria(
        tenant_id=current_user.tenant_id,
        data=data,
        usuario_nombre=nombre_autor,
    )


@router.post(
    "", response_model=RecordatorioResponse, status_code=status.HTTP_201_CREATED
)
async def create_recordatorio(
    data: RecordatorioCreate,
    current_user: User = Depends(get_current_active_user),
    service: RecordatorioService = Depends(get_recordatorio_service),
):
    """
    Crea un nuevo recordatorio o reporte de incidencia.
    """
    nombre_autor = current_user.full_name or current_user.username
    return await service.crear_recordatorio(
        data=data,
        tenant_id=current_user.tenant_id,
        usuario_id=str(current_user.id),
        usuario_nombre=nombre_autor,
        usuario_rol=str(current_user.role),
    )


@router.get("/{recordatorio_id}", response_model=RecordatorioResponse)
async def get_recordatorio(
    recordatorio_id: str,
    current_user: User = Depends(get_current_active_user),
    service: RecordatorioService = Depends(get_recordatorio_service),
):
    """
    Obtiene el detalle completo de un recordatorio por ID.
    """
    return await service.get_recordatorio_by_id(
        recordatorio_id=recordatorio_id,
        tenant_id=current_user.tenant_id,
    )


@router.put("/{recordatorio_id}", response_model=RecordatorioResponse)
async def update_recordatorio(
    recordatorio_id: str,
    data: RecordatorioUpdate,
    current_user: User = Depends(get_current_active_user),
    service: RecordatorioService = Depends(get_recordatorio_service),
):
    """
    Actualiza los datos de un recordatorio existente.
    """
    return await service.actualizar_recordatorio(
        recordatorio_id=recordatorio_id,
        data=data,
        tenant_id=current_user.tenant_id,
    )


@router.patch("/{recordatorio_id}/estado", response_model=RecordatorioResponse)
async def change_recordatorio_estado(
    recordatorio_id: str,
    data: RecordatorioEstadoUpdate,
    current_user: User = Depends(get_current_active_user),
    service: RecordatorioService = Depends(get_recordatorio_service),
):
    """
    Transiciona el estado del recordatorio (ej. PENDIENTE -> EN_SEGUIMIENTO -> RESUELTO) registrando auditoría.
    """
    nombre_autor = current_user.full_name or current_user.username
    return await service.cambiar_estado(
        recordatorio_id=recordatorio_id,
        data=data,
        tenant_id=current_user.tenant_id,
        usuario_id=str(current_user.id),
        usuario_nombre=nombre_autor,
    )


@router.delete("/{recordatorio_id}")
async def delete_recordatorio(
    recordatorio_id: str,
    current_user: User = Depends(get_current_active_user),
    service: RecordatorioService = Depends(get_recordatorio_service),
):
    """
    Inactiva un recordatorio mediante Soft Delete (no elimina datos físicos).
    """
    await service.eliminar_recordatorio(
        recordatorio_id=recordatorio_id,
        tenant_id=current_user.tenant_id,
    )
    return {"ok": True, "message": "Recordatorio desactivado exitosamente."}
