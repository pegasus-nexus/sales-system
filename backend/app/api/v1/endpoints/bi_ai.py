from typing import Any, Optional, Dict
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from app.infrastructure.auth import get_current_active_user
from app.domain.models.user import User
from app.application.services.bi_ml_forecasting_service import BIMLForecastingService
from app.application.services.bi_ml_product_demand_service import BIMLProductDemandService
from app.application.services.bi_ml_anomaly_service import BIMLAnomalyService
from app.application.services.bi_ai_diagnosis_service import BIAIDiagnosisService

router = APIRouter()


class ChatQueryRequest(BaseModel):
    message: str
    context_period: Optional[str] = "hoy"


@router.get("/forecast", response_model=None)
async def get_bi_ai_forecast(
    horizon_days: int = Query(default=14, ge=1, le=90),
    current_user: User = Depends(get_current_active_user)
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
    current_user: User = Depends(get_current_active_user)
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
    current_user: User = Depends(get_current_active_user)
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


@router.get("/diagnosis", response_model=None)
async def get_bi_ai_diagnosis(
    start_date: str = Query(default="hoy"),
    end_date: str = Query(default="hoy"),
    sucursal_id: Optional[str] = Query(default="all"),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Genera el Diagnóstico IA del Día para el Panel General consumiendo KPIs procesados.
    """
    return await BIAIDiagnosisService.generate_daily_diagnosis(
        user=current_user,
        start_date_str=start_date,
        end_date_str=end_date,
        sucursal_id=sucursal_id
    )


@router.get("/causal", response_model=None)
async def get_bi_ai_causal(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Retorna el Análisis Causal IA (Clima, Calendario, Feriados y Ubicación).
    """
    tenant_id = str(current_user.tenant_id)
    return await BIAIDiagnosisService.get_causal_factors(tenant_id=tenant_id)


@router.get("/recommendations", response_model=None)
async def get_bi_ai_recommendations(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Retorna las sugerencias y recomendaciones comerciales accionables de la IA.
    """
    tenant_id = str(current_user.tenant_id)
    return await BIAIDiagnosisService.get_commercial_recommendations(tenant_id=tenant_id)


@router.post("/chat", response_model=None)
async def post_bi_ai_chat(
    req: ChatQueryRequest,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Responde consultas interactivas del Chat BI sobre datos reales de ventas y finanzas.
    """
    query = req.message.lower().strip()
    
    # Generar respuesta contextual basada en datos del usuario
    diagnosis = await BIAIDiagnosisService.generate_daily_diagnosis(
        user=current_user,
        start_date_str="hoy",
        end_date_str="hoy"
    )
    detalles = diagnosis.get("detalles", {})
    total_ventas = detalles.get("total_ventas", 0.0)
    ordenes = detalles.get("total_ordenes", 0)
    rentabilidad = detalles.get("rentabilidad_pct", 0.0)

    if "bajar" in query or "caid" in query or "por que" in query or "por qué" in query:
        reply = (
            f"Basado en el análisis de hoy, se registraron Bs. {total_ventas:,.2f} en {ordenes} órdenes. "
            f"El margen líquido actual es del {rentabilidad:.1f}%. El impulsor principal identificado es: "
            f"{diagnosis.get('impulsor_clave')}. Se sugiere revisar: {diagnosis.get('alerta_riesgo')}."
        )
    elif "producto" in query or "impulsar" in query or "vender" in query:
        reply = (
            "Para maximizar el margen de hoy, se recomienda impulsar los productos Estrella (alto volumen y alto margen) "
            "y aplicar promociones combo en horarios de baja afluencia (14:00 - 16:00)."
        )
    elif "sucursal" in query or "tienda" in query:
        reply = (
            f"En la evaluación por sucursal, {diagnosis.get('impulsor_clave')} "
            f"mientras que {diagnosis.get('alerta_riesgo')}."
        )
    else:
        reply = (
            f"Resumen BI en tiempo real: Se han alcanzado Bs. {total_ventas:,.2f} en ventas netas con una rentabilidad del {rentabilidad:.1f}%. "
            f"El estado de salud del negocio es {diagnosis.get('score_salud')}. "
            f"Diagnóstico: {diagnosis.get('diagnostico_principal')}"
        )

    return {
        "status": "success",
        "query": req.message,
        "reply": reply,
        "timestamp": datetime.now().isoformat()
    }
