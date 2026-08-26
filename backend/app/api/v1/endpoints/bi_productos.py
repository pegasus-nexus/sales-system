from typing import Optional
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, Query, HTTPException

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.auth import get_current_user
from app.domain.models.user import User
from app.application.bi.productos_service import ProductosBIService
from app.schemas.bi_productos import BIProductosResponse

router = APIRouter()
BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


def get_productos_bi_service() -> ProductosBIService:
    return ProductosBIService()


@router.get("/productos", response_model=BIProductosResponse)
async def get_bi_productos_clean(
    start_date: Optional[str] = Query(None, description="Fecha inicio YYYY-MM-DD."),
    end_date: Optional[str] = Query(None, description="Fecha fin YYYY-MM-DD."),
    sucursal_id: Optional[str] = Query(None, description="ID de sucursal o 'all'."),
    current_user: User = Depends(get_current_user),
    service: ProductosBIService = Depends(get_productos_bi_service)
):
    """
    Obtiene el análisis trazable de rendimiento de productos y categorías.
    Implementado bajo la Reconstrucción Limpia desde Cero (Clean Architecture BI).
    """
    today_bolivia_str = datetime.now(BOLIVIA_TZ).strftime("%Y-%m-%d")
    s_date = start_date or today_bolivia_str
    e_date = end_date or today_bolivia_str

    try:
        return await service.get_productos_analysis(
            user=current_user,
            start_date=s_date,
            end_date=e_date,
            sucursal_id=sucursal_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando rendimiento de productos de BI (Clean): {str(e)}"
        )
