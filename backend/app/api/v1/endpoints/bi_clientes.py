from typing import Optional
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, Query, HTTPException

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.auth import get_current_user
from app.domain.models.user import User
from app.application.bi.clientes_service import ClientesBIService
from app.schemas.bi_clientes import BIClientesResponse

router = APIRouter()
BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


def get_clientes_bi_service() -> ClientesBIService:
    return ClientesBIService()


@router.get("/clientes", response_model=BIClientesResponse)
async def get_bi_clientes_clean(
    start_date: Optional[str] = Query(None, description="Fecha inicio YYYY-MM-DD."),
    end_date: Optional[str] = Query(None, description="Fecha fin YYYY-MM-DD."),
    sucursal_id: Optional[str] = Query(None, description="ID de sucursal o 'all'."),
    current_user: User = Depends(get_current_user),
    service: ClientesBIService = Depends(get_clientes_bi_service)
):
    """
    Obtiene el análisis trazable de clientes, métodos de pago y créditos.
    Implementado bajo la Reconstrucción Limpia desde Cero (Clean Architecture BI).
    """
    today_bolivia_str = datetime.now(BOLIVIA_TZ).strftime("%Y-%m-%d")
    s_date = start_date or today_bolivia_str
    e_date = end_date or today_bolivia_str

    try:
        return await service.get_clientes_analysis(
            user=current_user,
            start_date=s_date,
            end_date=e_date,
            sucursal_id=sucursal_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando métricas de clientes de BI (Clean): {str(e)}"
        )
