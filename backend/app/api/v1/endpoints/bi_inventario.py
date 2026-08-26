from typing import Optional
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, Query, HTTPException

from app.core.config import BUSINESS_TIMEZONE
from app.infrastructure.auth import get_current_user
from app.domain.models.user import User
from app.application.bi.inventario_service import InventarioBIService
from app.schemas.bi_inventario import BIInventarioControlResponse

router = APIRouter()
BOLIVIA_TZ = ZoneInfo(BUSINESS_TIMEZONE)


def get_inventario_bi_service() -> InventarioBIService:
    return InventarioBIService()


@router.get("/control", response_model=BIInventarioControlResponse)
async def get_bi_inventario_control_clean(
    sucursal_id: Optional[str] = Query(None, description="ID de sucursal o 'all'."),
    current_user: User = Depends(get_current_user),
    service: InventarioBIService = Depends(get_inventario_bi_service)
):
    """
    Obtiene el análisis trazable de control y valorización de inventario.
    Implementado bajo la Reconstrucción Limpia desde Cero (Clean Architecture BI).
    """
    try:
        return await service.get_inventario_analysis(
            user=current_user,
            sucursal_id=sucursal_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando control de inventario de BI (Clean): {str(e)}"
        )
