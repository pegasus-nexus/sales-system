from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.auth import get_current_active_user
from app.schemas.analytics import DashboardResponse, BCGMatrixResponse, OrchestrationResponse, DemandPredictionResponse
from app.services.analytics_service import get_dashboard_metrics, get_top_products_metrics, get_sales_by_branch_metrics
from app.services.bcg_service import calculate_bcg_matrix
from app.services.ml_service import predict_demand
from app.services.orchestration_service import get_dashboard_orchestration
from app.services.hourly_multiyear_service import get_hourly_multiyear
from app.services.percentile_service import get_sales_percentiles

router = APIRouter()

from typing import Dict, Any

@router.get("/dashboard")
async def get_dashboard(
    start_date: datetime = Query(..., description="Fecha de inicio (ejemplo: 2023-01-01T00:00:00)"),
    end_date: datetime = Query(..., description="Fecha de fin (ejemplo: 2023-12-31T23:59:59)"),
    time_range: str = Query("30days", description="Filtro rápido temporal"),
    clima_evento: Optional[str] = Query(None, description="Factor externo AI"),
    sucursal_id: Optional[str] = Query(None, description="Filtra las métricas por una sucursal en específico"),
    current_user = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Ruta maestra para el Dashboard comparativo (Real vs Pasado vs Previsto).
    """
    return await get_dashboard_metrics(
        tenant_id=current_user.tenant_id,
        start_date=start_date,
        end_date=end_date,
        sucursal_id=sucursal_id,
        time_range=time_range,
        clima_evento=clima_evento
    )

@router.get("/bcg", response_model=BCGMatrixResponse)
async def get_bcg_matrix(
    start_date: datetime = Query(..., description="Fecha inicial"),
    end_date: datetime = Query(..., description="Fecha final"),
    sucursal_id: Optional[str] = Query(None, description="Id de la sucursal"),
    current_user = Depends(get_current_active_user)
):
    """
    Ruta Mágica BCG: Compara dinámicamente el periodo dado con
    su periodo equivalente anterior para determinar Crecimiento y Cuota.
    """
    return await calculate_bcg_matrix(
        tenant_id=current_user.tenant_id,
        start_date=start_date,
        end_date=end_date,
        sucursal_id=sucursal_id
    )

@router.get("/orchestration", response_model=OrchestrationResponse)
async def get_orchestration(
    days: int = Query(30, description="Días de retroceso para calcular tendencias"),
    current_user = Depends(get_current_active_user)
):
    """
    Ruta maestra para el Dashboard Ejecutivo.
    """
    return await get_dashboard_orchestration(
        tenant_id=current_user.tenant_id,
        days=days
    )

@router.get("/ml/predict-demand", response_model=DemandPredictionResponse)
async def get_ml_demand_prediction(
    predict_days: int = Query(7, description="Días a proyectar (def: 7)"),
    sucursal_id: Optional[str] = Query(None, description="Filtrar proyección de demanda por sucursal"),
    current_user = Depends(get_current_active_user)
):
    """
    Predicción AI End-to-End usando Scikit-learn (RandomForest).
    """
    return await predict_demand(
        tenant_id=current_user.tenant_id,
        sucursal_id=sucursal_id,
        predict_days=predict_days
    )

from app.schemas.analytics import HistoricalImportRequest
from app.services.import_historical_service import process_historical_import

@router.post("/import-historical")
async def import_historical_data(
    payload: HistoricalImportRequest,
    current_user = Depends(get_current_active_user)
):
    """
    Carga de datos masiva desde Excel/CSV parseados en el cliente.
    """
    res = await process_historical_import(
        tenant_id=current_user.tenant_id,
        import_data=payload
    )
    return {"message": "Importación exitosa", "data": res}


@router.get("/hourly-multiyear")
async def get_hourly_multiyear_endpoint(
    fecha_referencia: date = Query(..., description="Fecha de referencia (YYYY-MM-DD). Compara con -364d y -728d."),
    sucursal: str = Query(None, description="Filtrar por nombre de sucursal (opcional). Ej: 'Heroinas'"),
    current_user = Depends(get_current_active_user)
):
    """
    Devuelve ventas por hora para la fecha elegida, hace 1 año (364d) y hace 2 años (728d).
    Incluye línea de Predicción (promedio histórico +10%) si la fecha es hoy.
    Rango horario fijo: 08:00 – 20:00.
    Opcionalmente filtra por sucursal.
    """
    return await get_hourly_multiyear(
        tenant_id=current_user.tenant_id,
        fecha_referencia=fecha_referencia,
        sucursal=sucursal
    )

@router.get("/top-products")
async def top_products_endpoint(
    start_date: datetime = Query(..., description="Fecha de inicio"),
    end_date: datetime = Query(..., description="Fecha de fin"),
    current_user = Depends(get_current_active_user)
):
    """
    Devuelve el Top 5 de productos más vendidos en un rango de fechas.
    """
    return await get_top_products_metrics(
        tenant_id=current_user.tenant_id,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/sales-by-branch")
async def sales_by_branch_endpoint(
    start_date: datetime = Query(..., description="Fecha de inicio"),
    end_date: datetime = Query(..., description="Fecha de fin"),
    current_user = Depends(get_current_active_user)
):
    """
    Devuelve la aportación geográfica por sucursal en un rango de fechas.
    """
    return await get_sales_by_branch_metrics(
        tenant_id=current_user.tenant_id,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/percentiles")
async def get_percentiles_endpoint(
    sucursal: str = Query(None, description="Filtrar por sucursal (opcional)"),
    days_history: int = Query(90, description="Días de historial para calcular percentiles"),
    group_by: str = Query("day", description="Agrupación: day | week | month"),
    current_user = Depends(get_current_active_user)
):
    """
    Calcula percentiles P25, mediana (P50), P75 de ventas agrupadas por día/semana/mes.
    Incluye proyecciones futuras basadas en P50 histórico.
    Clasifica cada período con semáforo de 4 colores: rojo, amarillo, verde, lila.
    """
    return await get_sales_percentiles(
        tenant_id=current_user.tenant_id,
        sucursal=sucursal,
        days_history=days_history,
        group_by=group_by,
    )
