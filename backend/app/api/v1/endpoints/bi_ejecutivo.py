from typing import Optional
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, Query, HTTPException

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.auth import get_current_user
from app.domain.models.user import User
from app.application.bi.ejecutivo_service import EjecutivoBIService
from app.schemas.bi_ejecutivo import BIEjecutivoResumenResponse

router = APIRouter()
BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


def get_ejecutivo_bi_service() -> EjecutivoBIService:
    return EjecutivoBIService()


@router.get("/resumen", response_model=BIEjecutivoResumenResponse)
async def get_bi_ejecutivo_resumen_clean(
    start_date: Optional[str] = Query(None, description="Fecha de inicio YYYY-MM-DD en America/La_Paz"),
    end_date: Optional[str] = Query(None, description="Fecha de fin YYYY-MM-DD en America/La_Paz"),
    sucursal_id: Optional[str] = Query(None, description="ID de sucursal o 'all'."),
    current_user: User = Depends(get_current_user),
    service: EjecutivoBIService = Depends(get_ejecutivo_bi_service)
):
    """
    Obtiene el resumen ejecutivo global consolidado de la empresa (Fase 10).
    Implementado bajo la Reconstrucción Limpia desde Cero (Clean Architecture BI).
    """
    try:
        return await service.get_ejecutivo_summary(
            user=current_user,
            start_date=start_date,
            end_date=end_date,
            sucursal_id=sucursal_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando resumen ejecutivo de BI (Clean): {str(e)}"
        )
