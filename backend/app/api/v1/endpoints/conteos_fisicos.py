from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.domain.models.user import User
from app.infrastructure.auth import get_current_active_user, require_roles
from app.domain.schemas.conteo_fisico import (
    ConteoFisicoResponse,
    ConteoFisicoListResponse,
    IniciarConteoRequest,
    GuardarConteoRequest
)
from app.application.services.conteo_fisico_service import ConteoFisicoService
from app.infrastructure.repositories.mongo_conteo_fisico_repository import MongoConteoFisicoRepository

router = APIRouter()

def get_conteo_service() -> ConteoFisicoService:
    repo = MongoConteoFisicoRepository()
    return ConteoFisicoService(repo)

@router.get("/conteos-fisicos", response_model=List[ConteoFisicoListResponse])
async def list_conteos(
    sucursal_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    service: ConteoFisicoService = Depends(get_conteo_service)
):
    """Lista todos los conteos (auditorías) históricos."""
    tenant_id = current_user.tenant_id or ""
    # Check permissions (admins/managers can see all, employees only their branch)
    if current_user.role not in ["SUPERADMIN", "ADMIN_MATRIZ"]:
        if sucursal_id and sucursal_id != current_user.sucursal_id:
            raise HTTPException(status_code=403, detail="No puedes ver conteos de otra sucursal")
        sucursal_id = current_user.sucursal_id
        
    return await service.list_conteos(tenant_id, sucursal_id)

@router.post("/conteos-fisicos/iniciar", response_model=ConteoFisicoResponse)
async def iniciar_conteo(
    req: IniciarConteoRequest,
    current_user: User = Depends(get_current_active_user),
    service: ConteoFisicoService = Depends(get_conteo_service)
):
    """Crea un nuevo snapshot del inventario actual para empezar a contar físicamente."""
    tenant_id = current_user.tenant_id or ""
    if current_user.role not in ["SUPERADMIN", "ADMIN_MATRIZ"] and req.sucursal_id != current_user.sucursal_id:
        raise HTTPException(status_code=403, detail="No puedes iniciar un conteo para otra sucursal")
        
    return await service.iniciar_conteo(
        req, 
        tenant_id, 
        str(current_user.id), 
        current_user.full_name or current_user.username
    )

@router.get("/conteos-fisicos/{conteo_id}", response_model=ConteoFisicoResponse)
async def get_conteo(
    conteo_id: str,
    current_user: User = Depends(get_current_active_user),
    service: ConteoFisicoService = Depends(get_conteo_service)
):
    """Obtiene los detalles completos de un conteo."""
    return await service.get_conteo(conteo_id, current_user.tenant_id or "")

@router.put("/conteos-fisicos/{conteo_id}", response_model=ConteoFisicoResponse)
async def guardar_conteo(
    conteo_id: str,
    req: GuardarConteoRequest,
    current_user: User = Depends(get_current_active_user),
    service: ConteoFisicoService = Depends(get_conteo_service)
):
    """Guarda el progreso del conteo físico en borrador."""
    return await service.guardar_progreso(conteo_id, req, current_user.tenant_id or "")

@router.post("/conteos-fisicos/{conteo_id}/finalizar", response_model=ConteoFisicoResponse)
async def finalizar_conteo(
    conteo_id: str,
    current_user: User = Depends(get_current_active_user),
    service: ConteoFisicoService = Depends(get_conteo_service)
):
    """Cierra el conteo y lo marca como finalizado de solo lectura."""
    return await service.finalizar_conteo(conteo_id, current_user.tenant_id or "")

@router.delete("/conteos-fisicos/{conteo_id}")
async def eliminar_conteo(
    conteo_id: str,
    current_user: User = Depends(require_roles(["SUPERADMIN", "ADMIN_MATRIZ", "ADMIN_SUCURSAL"])),
    service: ConteoFisicoService = Depends(get_conteo_service)
):
    """Elimina (soft delete) un conteo borrador o erróneo."""
    return await service.eliminar_conteo(conteo_id, current_user.tenant_id or "")
