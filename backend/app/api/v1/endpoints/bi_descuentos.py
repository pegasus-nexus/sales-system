from typing import Optional
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, Query, HTTPException

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.auth import get_current_user
from app.domain.models.user import User
from app.application.bi.descuentos_service import DescuentosBIService
from app.schemas.bi_descuentos import BIDescuentosImpactoResponse

router = APIRouter()
BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


def get_descuentos_bi_service() -> DescuentosBIService:
    return DescuentosBIService()


@router.get("/impacto", response_model=BIDescuentosImpactoResponse)
async def get_bi_descuentos_impacto_clean(
    start_date: Optional[str] = Query(None, description="Fecha de inicio YYYY-MM-DD en America/La_Paz"),
    end_date: Optional[str] = Query(None, description="Fecha de fin YYYY-MM-DD en America/La_Paz"),
    sucursal_id: Optional[str] = Query(None, description="ID de sucursal o 'all'."),
    current_user: User = Depends(get_current_user),
    service: DescuentosBIService = Depends(get_descuentos_bi_service)
):
    """
    Obtiene el análisis trazable del impacto comercial de descuentos y promociones.
    Implementado bajo la Reconstrucción Limpia desde Cero (Clean Architecture BI).
    """
    try:
        return await service.get_descuentos_analysis(
            user=current_user,
            start_date=start_date,
            end_date=end_date,
            sucursal_id=sucursal_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando impacto de descuentos de BI (Clean): {str(e)}"
        )
