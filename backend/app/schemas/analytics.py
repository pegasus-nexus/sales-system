from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class KpiResumen(BaseModel):
    total_ventas: float = Field(0.0, description="Suma total de todas las ventas (ingresos)")
    costo_total: float = Field(0.0, description="Suma total de los costos de los productos vendidos")
    margen_bruto: float = Field(0.0, description="Margen bruto en dinero real (total - costo)")
    cantidad_transacciones: int = Field(0, description="Número total de boletas o transacciones exitosas")
    ticket_promedio: float = 0.0
    percentil_90: float = 0.0
    percentil_50: float = 0.0
    clientes_recurrentes: float = 0.0

class SucursalVenta(BaseModel):
    sucursal_id: str
    total_ingresos: float = Field(0.0, description="Ingresos totales de esta sucursal específica")
    total_margen: float = Field(0.0, description="Margen líquido de rentabilidad de esta sucursal")

class VentasPorSucursal(BaseModel):
    detalle: List[SucursalVenta] = []

class ProductoTop(BaseModel):
    producto_id: str
    nombre: str
    cantidad_vendida: int
    ingresos: float = Field(0.0, description="Ingresos generados por este producto")

class TopProductos(BaseModel):
    productos: List[ProductoTop] = []

class DistribucionHoraria(BaseModel):
    hora: str
    ingresos: float

class HourlyComparisson(BaseModel):
    hora: str                 # "08:00", "09:00"
    venta_hoy: float
    venta_pasada: float       # Venta hace 364 dias
    is_now: bool = False      # si es la hora actual

class DashboardResponse(BaseModel):
    kpis: KpiResumen
    ventas_por_sucursal: VentasPorSucursal
    top_productos: TopProductos
    distribucion_horaria: List[HourlyComparisson] = []


# ── Modelos de Matriz BCG ───────────────────────────────────────────────
class BCGProduct(BaseModel):
    producto_id: str
    nombre: str
    ingresos_actuales: float = 0.0
    ingresos_anteriores: float = 0.0
    cantidad_vendida: float = 0.0
    cantidad_anterior: float = 0.0
    crecimiento: float = Field(0.0, description="Porcentaje de crecimiento en decimal (-0.5 a 1.0+)")
    cuota_relativa: float = Field(0.0, description="Cuota respecto al producto líder (0.0 a 1.0)")
    cuadrante: str = Field(..., description="'ESTRELLA', 'VACA', 'INTERROGANTE', 'PERRO'")
    estrategia_sugerida: Optional[str] = Field(None, description="Directriz de negocio (ej. Inversión, Liquidación, etc.)")
    margen_ganancia: float = Field(0.0, description="Margen de ganancia total del periodo (Ingresos - Costo)")
    history: List[Dict[str, Any]] = Field(default_factory=list, description="Historial de cuota, crecimiento y margen en periodos anteriores")
    tendencia_str: Optional[str] = None
    badge: Optional[str] = None
    nota: Optional[str] = None

class BCGMatrixResponse(BaseModel):
    estrellas: List[BCGProduct] = []
    vacas: List[BCGProduct] = []
    interrogantes: List[BCGProduct] = []
    perros: List[BCGProduct] = []

# ── Modelos End-to-End Orchestration / ML ─────────────────────────────

class OrchestrationOverview(BaseModel):
    total_revenue: float
    revenue_growth: float
    total_orders: int
    orders_growth: float
    active_customers: int
    customers_growth: float
    average_ticket: float

class OrchestrationRevenueTrend(BaseModel):
    name: str # Mes
    ingresos: Optional[float]
    meta: float

class OrchestrationCategoryMix(BaseModel):
    name: str
    value: float

class OrchestrationRecentActivity(BaseModel):
    id: int
    type: str # 'sale', 'inventory', 'goal', 'alert'
    msg: str
    time: str
    val: str

class OrchestrationResponse(BaseModel):
    overview: OrchestrationOverview
    revenue_trend: List[OrchestrationRevenueTrend]
    sales_by_branch: List[Dict[str, Any]] # {"name": str, "ventas": float}
    top_categories: List[OrchestrationCategoryMix]
    recent_activity: List[OrchestrationRecentActivity]

class DemandPredictionPoint(BaseModel):
    date: str
    real: Optional[float] = None
    prediccion: float          # Average or fallback
    pred_p10: Optional[float] = None  # Pesimista / Bajo
    pred_p50: Optional[float] = None  # Medio / Esperado
    pred_p90: Optional[float] = None  # Optimista / Alto
    margen_error: List[float] # [min, max] fallback visual
    weather_temp_max: Optional[float] = None
    weather_precip: Optional[float] = None

class HourlyComparisson(BaseModel):
    hora: str                 # "08:00", "09:00"
    venta_hoy: float
    venta_pasada: float       # Venta hace 364 dias
    is_now: bool = False      # si es la hora actual

class DemandPredictionResponse(BaseModel):
    model_accuracy: float = 94.2
    insight: str = "Se espera demanda alcista la proxima semana"
    trend_percentage: float = 12.0
    predictions: List[DemandPredictionPoint] = []
    hourly_today: List[HourlyComparisson] = []

# ── Modelos de Importación Histórica ────────────────────────────

class HistoricalImportRow(BaseModel):
    fecha: str
    producto_nombre: str
    cantidad: float
    precio_unitario: float

class HistoricalImportRequest(BaseModel):
    sucursal_id: str
    rows: List[HistoricalImportRow]
