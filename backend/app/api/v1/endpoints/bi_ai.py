from typing import Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.infrastructure.auth import get_current_active_user
from app.schemas.user import UserInDB
from app.application.services.bi_ml_forecasting_service import BIMLForecastingService
from app.application.services.bi_ml_product_demand_service import BIMLProductDemandService
from app.application.services.bi_ml_anomaly_service import BIMLAnomalyService

router = APIRouter()


@router.get("/forecast", response_model=None)
async def get_bi_ai_forecast(
    horizon_days: int = Query(default=14, ge=1, le=30),
    current_user: UserInDB = Depends(get_current_active_user)
) -> Any:
    """
    Retorna el pronóstico predictivo de ventas y tickets utilizando Holt-Winters (7d estacional).
    Respeta Aislamiento Multi-Tenant y marca explícitamente PREDICCIÓN ML.
    """
    tenant_id = str(current_user.tenant_id)
    res = await BIMLForecastingService.evaluate_models_backtesting(
        tenant_id=tenant_id,
        horizon_days=horizon_days
    )
    if res["status"] != "success":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=res.get("message", "Error al generar pronóstico de IA")
        )
    return res


@router.get("/product-demand", response_model=None)
async def get_bi_ai_product_demand(
    horizon_days: int = Query(default=7, ge=1, le=30),
    current_user: UserInDB = Depends(get_current_active_user)
) -> Any:
    """
    Retorna la estimación de demanda física por producto (SKU) con intervalos de confianza del 95%.
    Etiqueta explícitamente SKUs con historial insuficiente.
    """
    tenant_id = str(current_user.tenant_id)
    res = await BIMLProductDemandService.predict_demand_by_product(
        tenant_id=tenant_id,
        horizon_days=horizon_days
    )
    if res["status"] != "success":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=res.get("message", "Error al calcular demanda por producto")
        )
    return res


@router.get("/anomalies", response_model=None)
async def get_bi_ai_anomalies(
    threshold_zscore: float = Query(default=2.0, ge=1.0, le=5.0),
    current_user: UserInDB = Depends(get_current_active_user)
) -> Any:
    """
    Retorna las alertas operacionales de anomalías detectadas en ventas y tickets mediante Z-Score.
    No modifica ningún dato histórico de MongoDB.
    """
    tenant_id = str(current_user.tenant_id)
    res = await BIMLAnomalyService.detect_operational_anomalies(
        tenant_id=tenant_id,
        threshold_zscore=threshold_zscore
    )
    if res["status"] != "success":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=res.get("message", "Error al analizar anomalías operacionales")
        )
    return res
