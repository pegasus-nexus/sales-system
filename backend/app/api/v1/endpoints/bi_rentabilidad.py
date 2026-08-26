from typing import Optional
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, Query, HTTPException

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.auth import get_current_user
from app.domain.models.user import User
from app.application.bi.rentabilidad_service import RentabilidadBIService
from app.schemas.bi_rentabilidad import BIRentabilidadMargenResponse

router = APIRouter()
BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


def get_rentabilidad_bi_service() -> RentabilidadBIService:
    return RentabilidadBIService()


def get_formatted_bolivia_date(days_offset: int = 0) -> str:
    now = datetime.now(BOLIVIA_TZ)
    target = now + timedelta(days=days_offset) if days_offset != 0 else now
    return target.strftime("%Y-%m-%d")


@router.get("/margen", response_model=BIRentabilidadMargenResponse)
async def get_bi_rentabilidad_margen_clean(
    start_date: Optional[str] = Query(None, description="Fecha de inicio YYYY-MM-DD en America/La_Paz"),
    end_date: Optional[str] = Query(None, description="Fecha de fin YYYY-MM-DD en America/La_Paz"),
    sucursal_id: Optional[str] = Query(None, description="ID de sucursal o 'all'."),
    current_user: User = Depends(get_current_user),
    service: RentabilidadBIService = Depends(get_rentabilidad_bi_service)
):
    """
    Obtiene el análisis trazable de rentabilidad teórica y margen bruto.
    Implementado bajo la Reconstrucción Limpia desde Cero (Clean Architecture BI).
    """
    today_bolivia_str = datetime.now(BOLIVIA_TZ).strftime("%Y-%m-%d")
    s_date = start_date or today_bolivia_str
    e_date = end_date or today_bolivia_str

    try:
        return await service.get_rentabilidad_analysis(
            user=current_user,
            start_date=s_date,
            end_date=e_date,
            sucursal_id=sucursal_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando margen de rentabilidad de BI (Clean): {str(e)}"
        )
