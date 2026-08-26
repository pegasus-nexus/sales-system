from typing import Optional
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, Query, HTTPException

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.auth import get_current_user
from app.domain.models.user import User
from app.application.bi.productividad_service import ProductividadBIService
from app.schemas.bi_productividad import BIProductividadDesempenoResponse

router = APIRouter()
BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


def get_productividad_bi_service() -> ProductividadBIService:
    return ProductividadBIService()


@router.get("/desempeno", response_model=BIProductividadDesempenoResponse)
async def get_bi_productividad_desempeno_clean(
    start_date: Optional[str] = Query(None, description="Fecha de inicio YYYY-MM-DD en America/La_Paz"),
    end_date: Optional[str] = Query(None, description="Fecha de fin YYYY-MM-DD en America/La_Paz"),
    sucursal_id: Optional[str] = Query(None, description="ID de sucursal o 'all'."),
    current_user: User = Depends(get_current_user),
    service: ProductividadBIService = Depends(get_productividad_bi_service)
):
    """
    Obtiene el análisis trazable del desempeño de cajeros y auditoría operacional.
    Implementado bajo la Reconstrucción Limpia desde Cero (Clean Architecture BI).
    """
    try:
        return await service.get_productividad_analysis(
            user=current_user,
            start_date=start_date,
            end_date=end_date,
            sucursal_id=sucursal_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando productividad de cajeros de BI (Clean): {str(e)}"
        )
