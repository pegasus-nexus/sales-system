from typing import Optional, List, Dict, Any
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, Query, HTTPException

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.auth import get_current_user
from app.domain.models.user import User
from app.infrastructure.repositories.mongo_bi_repository import MongoBIRepository
from app.application.services.bi_service import BIService
from app.schemas.bi import BIPanelGeneralResponse

router = APIRouter()
BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


def get_bi_service() -> BIService:
    repository = MongoBIRepository()
    return BIService(repository=repository)


@router.get("/panel-general", response_model=BIPanelGeneralResponse)
async def get_bi_panel_general(
    start_date: Optional[str] = Query(
        None,
        description="Fecha de inicio YYYY-MM-DD en hora de Bolivia. Por defecto el día de hoy."
    ),
    end_date: Optional[str] = Query(
        None,
        description="Fecha de fin YYYY-MM-DD en hora de Bolivia. Por defecto el día de hoy."
    ),
    sucursal_id: Optional[str] = Query(
        None,
        description="ID de sucursal específica o 'all' para todas las sucursales."
    ),
    current_user: User = Depends(get_current_user),
    bi_service: BIService = Depends(get_bi_service)
):
    """
    Obtiene las métricas oficiales trazables del Panel General del nuevo BI.
    Aplica el Modelo Estrella mediante Pandas sobre las ventas reales registradas por el POS,
    respetando estrictamente la zona horaria America/La_Paz.
    """
    today_bolivia_str = datetime.now(BOLIVIA_TZ).strftime("%Y-%m-%d")
    s_date = start_date or today_bolivia_str
    e_date = end_date or today_bolivia_str

    try:
        tenant_id = str(current_user.tenant_id)
        return await bi_service.get_panel_general(
            tenant_id=tenant_id,
            start_date=s_date,
            end_date=e_date,
            sucursal_id=sucursal_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando métricas del Panel General de BI: {str(e)}"
        )


@router.get("/sucursales", response_model=List[Dict[str, Any]])
async def get_bi_sucursales(
    current_user: User = Depends(get_current_user),
    bi_service: BIService = Depends(get_bi_service)
):
    """
    Obtiene la dimensión oficial de sucursales para los filtros del BI.
    """
    tenant_id = str(current_user.tenant_id)
    return await bi_service.get_sucursales_dim(tenant_id=tenant_id)
