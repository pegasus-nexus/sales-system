from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from app.infrastructure.auth import get_current_active_user
from app.domain.models.user import User, UserRole
from app.application.services.contabilidad_service import ContabilidadService
from app.application.services.contabilidad_reportes_service import ContabilidadReportesService

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN_MATRIZ, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="No permissions for accounting module")
    return current_user

class CuentaCreate(BaseModel):
    codigo: str
    nombre: str
    tipo: str
    naturaleza: str
    padre_id: Optional[str] = None
    nivel: int = 1
    es_cuenta_de_detalle: bool = True
    descripcion: Optional[str] = None

class CuentaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    es_cuenta_de_detalle: Optional[bool] = None

@router.get("/plan-cuentas")
async def get_plan_cuentas(current_user: User = Depends(require_admin)):
    cuentas = await ContabilidadService.get_plan_cuentas(current_user.tenant_id)
    return cuentas

@router.post("/plan-cuentas/seed")
async def seed_plan_cuentas(current_user: User = Depends(require_admin)):
    cuentas = await ContabilidadService.seed_plan_cuentas(current_user.tenant_id, str(current_user.id))
    return cuentas

@router.post("/cuentas")
async def create_cuenta(data: CuentaCreate, current_user: User = Depends(require_admin)):
    cuenta = await ContabilidadService.create_cuenta(current_user.tenant_id, data.model_dump(), str(current_user.id))
    return cuenta

@router.put("/cuentas/{cuenta_id}")
async def update_cuenta(cuenta_id: str, data: CuentaUpdate, current_user: User = Depends(require_admin)):
    cuenta = await ContabilidadService.update_cuenta(current_user.tenant_id, cuenta_id, data.model_dump(exclude_unset=True), str(current_user.id))
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta not found")
    return cuenta

@router.get("/estado-resultados")
async def get_estado_resultados(
    fecha_inicio: datetime,
    fecha_fin: datetime,
    sucursal_id: Optional[str] = None,
    current_user: User = Depends(require_admin)
):
    resultado = await ContabilidadReportesService.get_estado_resultados(
        current_user.tenant_id, fecha_inicio, fecha_fin, sucursal_id
    )
    return resultado

@router.get("/balance-general")
async def get_balance_general(
    fecha_corte: datetime,
    sucursal_id: Optional[str] = None,
    current_user: User = Depends(require_admin)
):
    resultado = await ContabilidadReportesService.get_balance_general(
        current_user.tenant_id, fecha_corte, sucursal_id
    )
    return resultado

@router.get("/flujo-efectivo")
async def get_flujo_efectivo(
    fecha_inicio: datetime,
    fecha_fin: datetime,
    sucursal_id: Optional[str] = None,
    current_user: User = Depends(require_admin)
):
    resultado = await ContabilidadReportesService.get_flujo_efectivo(
        current_user.tenant_id, fecha_inicio, fecha_fin, sucursal_id
    )
    return resultado
