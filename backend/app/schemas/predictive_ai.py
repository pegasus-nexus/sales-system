from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ExecutiveAISummary(BaseModel):
    confidence_score: float = Field(..., description="Nivel de confianza del modelo en %")
    summary_text: str = Field(..., description="Informe ejecutivo generado dinámicamente por IA")
    top_growth_driver: str = Field(..., description="Principal impulsor del crecimiento proyectado")
    critical_risks: List[str] = Field(default_factory=list, description="Riesgos principales detectados")
    top_recommendations: List[str] = Field(default_factory=list, description="Recomendaciones clave a 72h")

class SalesForecastPoint(BaseModel):
    date: str
    real: Optional[float] = None
    pred_p10: float = Field(..., description="Proyección pesimista P10")
    pred_p50: float = Field(..., description="Proyección esperada P50")
    pred_p90: float = Field(..., description="Proyección optimista P90")
    is_future: bool = True
    weather_temp: Optional[float] = None
    weather_precip: Optional[float] = None

class BranchForecast(BaseModel):
    branch_name: str
    expected_sales: float
    variation_pct: float
    confidence: float
    expected_margin: float
    expected_transactions: int

class ProductGrowthItem(BaseModel):
    product_name: str
    current_sales: float
    expected_sales: float
    growth_pct: float
    confidence: float

class ProductRiskItem(BaseModel):
    product_name: str
    expected_drop_pct: float
    reason: str
    confidence: float

class AIRecommendation(BaseModel):
    title: str
    reason: str
    impact_level: str = "Medio" # Alto, Medio, Bajo
    branch_target: Optional[str] = None
    action_type: str = "Inventario" # Inventario, Promoción, Personal, Precios

class ScenarioSimulationRequest(BaseModel):
    sucursal: str = "todas" # todas, Heroínas, Recoleta, Calacoto
    temperatura: float = 20.0
    lluvia: float = 0.0
    descuento: float = 0.0 # 0 a 50%
    inventario_pct: float = 100.0 # 50% a 150%
    festivo: bool = False

class ScenarioSimulationResponse(BaseModel):
    expected_sales: float
    expected_margin: float
    expected_transactions: int
    expected_customers: int
    risk_level: str # Bajo, Medio, Alto, Crítico
    confidence: float

class PredictiveCalendarDay(BaseModel):
    date: str
    day_name: str
    expected_sales: float
    demand_level: str # Normal, Alta, Crítica, Festividad
    confidence: float
    status_color: str # verde, naranja, rojo, azul
    is_holiday: bool = False
    holiday_name: Optional[str] = None

class UpcomingImpactEvent(BaseModel):
    event_name: str
    date_approx: str
    expected_impact_pct: float
    confidence: float
    icon_type: str = "default"

class DetectedRisk(BaseModel):
    risk_type: str # Ruptura de Stock, Sobrestock, Baja Demanda
    product_or_category: str
    probability_pct: float
    severity: str # Crítica, Alta, Media

class DetectedOpportunity(BaseModel):
    type: str # Sucursal, Producto, Categoría
    title: str
    growth_pct: float
    description: str

class ModelExplanation(BaseModel):
    model_name: str = "Gradient Boosting Regressor"
    quantile_loss: str = "Quantile Loss (P10, P50, P90)"
    features: List[str] = Field(default_factory=list)
    description: str = ""

class ModelConfidenceMeta(BaseModel):
    reliability_pct: float = 97.4
    trained_transactions: int = 420000
    historical_days: int = 730
    festivities_count: int = 15
    branches_count: int = 3
    products_count: int = 330
    last_trained: str = "Reciente"

class PredictiveCenterResponse(BaseModel):
    executive_summary: ExecutiveAISummary
    sales_forecast: List[SalesForecastPoint]
    branch_forecasts: List[BranchForecast]
    top_growth_products: List[ProductGrowthItem]
    products_at_risk: List[ProductRiskItem]
    ai_recommendations: List[AIRecommendation]
    predictive_calendar: List[PredictiveCalendarDay]
    upcoming_events: List[UpcomingImpactEvent]
    detected_risks: List[DetectedRisk]
    detected_opportunities: List[DetectedOpportunity]
    model_explanation: ModelExplanation
    model_meta: ModelConfidenceMeta
