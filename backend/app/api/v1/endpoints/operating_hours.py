from typing import List
from fastapi import APIRouter, Depends, Body
from pydantic import BaseModel, Field
from app.infrastructure.auth import get_current_user
from app.domain.models.user import User
from app.infrastructure.repositories.mongo_operating_hours_repository import MongoBranchOperatingHoursRepository
from app.application.services.operating_hours_service import OperatingHoursService

router = APIRouter()


class OperatingHoursUpdateRequest(BaseModel):
    sucursal_id: str
    sucursal_nombre: str = "Sucursal"
    opening_time: str = Field("08:00", description="Hora de apertura en formato HH:MM 24h")
    closing_time: str = Field("21:00", description="Hora de cierre en formato HH:MM 24h")
    allow_after_hours: bool = True


class OperatingHoursResponse(BaseModel):
    tenant_id: str
    sucursal_id: str
    sucursal_nombre: str
    opening_time: str
    closing_time: str
    allow_after_hours: bool


def get_operating_hours_service() -> OperatingHoursService:
    repo = MongoBranchOperatingHoursRepository()
    return OperatingHoursService(repo=repo)


@router.get("/operating-hours", response_model=List[OperatingHoursResponse])
async def get_operating_hours(
    current_user: User = Depends(get_current_user),
    service: OperatingHoursService = Depends(get_operating_hours_service)
):
    tenant_id = current_user.tenant_id or "default"
    docs = await service.get_all_operating_hours(tenant_id=tenant_id)
    return [
        OperatingHoursResponse(
            tenant_id=doc.tenant_id,
            sucursal_id=doc.sucursal_id,
            sucursal_nombre=doc.sucursal_nombre,
            opening_time=doc.opening_time,
            closing_time=doc.closing_time,
            allow_after_hours=doc.allow_after_hours
        )
        for doc in docs
    ]


@router.post("/operating-hours", response_model=OperatingHoursResponse)
async def update_operating_hours(
    payload: OperatingHoursUpdateRequest = Body(...),
    current_user: User = Depends(get_current_user),
    service: OperatingHoursService = Depends(get_operating_hours_service)
):
    tenant_id = current_user.tenant_id or "default"
    doc = await service.save_operating_hours(
        tenant_id=tenant_id,
        sucursal_id=payload.sucursal_id,
        sucursal_nombre=payload.sucursal_nombre,
        opening_time=payload.opening_time,
        closing_time=payload.closing_time,
        allow_after_hours=payload.allow_after_hours
    )
    return OperatingHoursResponse(
        tenant_id=doc.tenant_id,
        sucursal_id=doc.sucursal_id,
        sucursal_nombre=doc.sucursal_nombre,
        opening_time=doc.opening_time,
        closing_time=doc.closing_time,
        allow_after_hours=doc.allow_after_hours
    )
