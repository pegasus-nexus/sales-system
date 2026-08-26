from typing import Optional
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, Query, HTTPException

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.auth import get_current_user
from app.domain.models.user import User
from app.application.bi.sucursales_service import SucursalesBIService
from app.schemas.bi_sucursales import BISucursalesDesempenoResponse

router = APIRouter()
BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


def get_sucursales_bi_service() -> SucursalesBIService:
    return SucursalesBIService()


@router.get("/desempeno", response_model=BISucursalesDesempenoResponse)
async def get_bi_sucursales_desempeno_clean(
    start_date: Optional[str] = Query(None, description="Fecha inicio YYYY-MM-DD."),
    end_date: Optional[str] = Query(None, description="Fecha fin YYYY-MM-DD."),
    sucursal_id: Optional[str] = Query(None, description="ID de sucursal o 'all'."),
    current_user: User = Depends(get_current_user),
    service: SucursalesBIService = Depends(get_sucursales_bi_service)
):
    """
    Obtiene el análisis trazable de desempeño por sucursales / tiendas.
    Implementado bajo la Reconstrucción Limpia desde Cero (Clean Architecture BI).
    """
    today_bolivia_str = datetime.now(BOLIVIA_TZ).strftime("%Y-%m-%d")
    s_date = start_date or today_bolivia_str
    e_date = end_date or today_bolivia_str

    try:
        return await service.get_sucursales_analysis(
            user=current_user,
            start_date=s_date,
            end_date=e_date,
            sucursal_id=sucursal_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando desempeño por sucursales de BI (Clean): {str(e)}"
        )
