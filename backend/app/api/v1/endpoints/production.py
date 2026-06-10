from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from app.application.services.production_service import ProductionService
from app.dependencies import get_production_service
from app.domain.models.user import User
from app.domain.models.meal_schedule import MealScheduleStatus, MealSchedule
from app.infrastructure.auth import get_current_active_user

router = APIRouter()

class UpdateScheduleRequest(BaseModel):
    recetas_ids: Optional[List[str]] = None
    estado: Optional[MealScheduleStatus] = None
    motivo_postergacion: Optional[str] = None

@router.get("/production/daily-report")
async def get_daily_production_report(
    fecha: str = Query(..., description="Fecha en formato YYYY-MM-DD"),
    current_user: User = Depends(get_current_active_user),
    service: ProductionService = Depends(get_production_service)
):
    tenant_id = current_user.tenant_id or "default"
    sucursal_id = current_user.sucursal_id or "default"
    return await service.get_daily_production_report(tenant_id, sucursal_id, fecha)

@router.put("/production/schedules/{schedule_id}")
async def update_meal_schedule(
    schedule_id: str,
    data: UpdateScheduleRequest,
    current_user: User = Depends(get_current_active_user),
    service: ProductionService = Depends(get_production_service)
):
    tenant_id = current_user.tenant_id or "default"
    return await service.update_meal_schedule(
        tenant_id=tenant_id,
        schedule_id=schedule_id,
        recetas_ids=data.recetas_ids,
        estado=data.estado,
        motivo_postergacion=data.motivo_postergacion
    )

@router.post("/production/schedules/{schedule_id}/deliver")
async def mark_schedule_as_delivered(
    schedule_id: str,
    current_user: User = Depends(get_current_active_user),
    service: ProductionService = Depends(get_production_service)
):
    tenant_id = current_user.tenant_id or "default"
    sucursal_id = current_user.sucursal_id or "default"
    return await service.mark_as_delivered(tenant_id, sucursal_id, schedule_id, current_user)
