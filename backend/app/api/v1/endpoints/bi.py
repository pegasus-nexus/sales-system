from typing import Optional, List, Dict, Any
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, Query, HTTPException

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.auth import get_current_user
from app.domain.models.user import User
from app.infrastructure.repositories.mongo_bi_repository import MongoBIRepository
from app.application.services.bi_service import BIService
from app.schemas.bi import BIPanelGeneralResponse, BIComparativaResponse, BIProductosResponse

router = APIRouter()
BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


def get_bi_service() -> BIService:
    repository = MongoBIRepository()
    return BIService(repository=repository)


@router.get("/health")
async def bi_health_check():
    return {
        "status": "ok",
        "module": "business_intelligence",
        "timezone": BUSINESS_TIMEZONE,
        "timestamp": datetime.now(BOLIVIA_TZ).strftime("%Y-%m-%d %H:%M:%S")
    }


@router.get("/panel-general", response_model=BIPanelGeneralResponse)
async def get_bi_panel_general(
    start_date: Optional[str] = Query(None, description="Fecha de inicio YYYY-MM-DD o 'historial'."),
    end_date: Optional[str] = Query(None, description="Fecha de fin YYYY-MM-DD o 'historial'."),
    sucursal_id: Optional[str] = Query(None, description="ID de sucursal específica o 'all'."),
    current_user: User = Depends(get_current_user),
    bi_service: BIService = Depends(get_bi_service)
):
    today_bolivia_str = datetime.now(BOLIVIA_TZ).strftime("%Y-%m-%d")
    s_date = start_date or today_bolivia_str
    e_date = end_date or today_bolivia_str

    try:
        return await bi_service.get_panel_general(
            current_user=current_user,
            start_date=s_date,
            end_date=e_date,
            sucursal_id=sucursal_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando métricas del Panel General de BI: {str(e)}"
        )


@router.get("/comparativas", response_model=BIComparativaResponse)
async def get_bi_comparativas(
    start_date: Optional[str] = Query(None, description="Fecha inicio del período actual YYYY-MM-DD."),
    end_date: Optional[str] = Query(None, description="Fecha fin del período actual YYYY-MM-DD."),
    comparar_contra: str = Query("ayer", description="Modo comparativo: 'ayer' | 'semana_anterior' | 'mes_anterior' | 'ano_anterior'."),
    sucursal_id: Optional[str] = Query(None, description="ID de sucursal o 'all'."),
    current_user: User = Depends(get_current_user),
    bi_service: BIService = Depends(get_bi_service)
):
    today_bolivia_str = datetime.now(BOLIVIA_TZ).strftime("%Y-%m-%d")
    s_date = start_date or today_bolivia_str
    e_date = end_date or today_bolivia_str

    try:
        return await bi_service.get_comparativas(
            current_user=current_user,
            start_date=s_date,
            end_date=e_date,
            comparar_contra=comparar_contra,
            sucursal_id=sucursal_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando comparativas del BI: {str(e)}"
        )


@router.get("/productos", response_model=BIProductosResponse)
async def get_bi_productos(
    start_date: Optional[str] = Query(None, description="Fecha inicio YYYY-MM-DD."),
    end_date: Optional[str] = Query(None, description="Fecha fin YYYY-MM-DD."),
    sucursal_id: Optional[str] = Query(None, description="ID de sucursal o 'all'."),
    current_user: User = Depends(get_current_user),
    bi_service: BIService = Depends(get_bi_service)
):
    """
    Obtiene el análisis de rendimiento de productos y categorías aplicando el Modelo Estrella
    (FACT_SALES_ITEMS) sobre las ventas reales registradas por el POS en MongoDB 'sales'.
    """
    today_bolivia_str = datetime.now(BOLIVIA_TZ).strftime("%Y-%m-%d")
    s_date = start_date or today_bolivia_str
    e_date = end_date or today_bolivia_str

    try:
        return await bi_service.get_productos_analysis(
            current_user=current_user,
            start_date=s_date,
            end_date=e_date,
            sucursal_id=sucursal_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando rendimiento de productos de BI: {str(e)}"
        )


@router.get("/sucursales", response_model=List[Dict[str, Any]])
async def get_bi_sucursales(
    current_user: User = Depends(get_current_user),
    bi_service: BIService = Depends(get_bi_service)
):
    tenant_id = str(current_user.tenant_id)
    return await bi_service.get_sucursales_dim(tenant_id=tenant_id)
