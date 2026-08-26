from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DesgloseSucursalBI(BaseModel):
    sucursal_id: str
    nombre_sucursal: str
    ingresos: float = 0.0
    ordenes: int = 0
    ticket_medio: float = 0.0
    participacion_pct: float = 0.0


class HourlyDistributionItemBI(BaseModel):
    hora: int
    rango: str
    ingresos: float = 0.0
    ordenes: int = 0


class VentaRecienteBI(BaseModel):
    ticket_id: str
    numero_ticket: str
    hora_bolivia: str
    nombre_sucursal: str
    total_neto: float
    estado_pago: str


class ResumenOperativoBI(BaseModel):
    sucursal_lider: str = "Sin actividad"
    mejor_hora: str = "00:00"
    promedio_por_hora: float = 0.0
    ultima_venta_hora: str = "Sin registros"


class AlertaOperativaBI(BaseModel):
    tipo: str  # 'info' | 'warning' | 'error'
    titulo: str
    mensaje: str


class BIPanelGeneralResponse(BaseModel):
    fecha_inicio_bolivia: str
    fecha_fin_bolivia: str
    timezone: str = "America/La_Paz"
    estado_sincronizacion: str = "Datos sincronizados con POS"
    ultima_actualizacion: str
    modo: str = "Tiempo Real"

    # KPIs Principales Trazables
    ingresos_totales: float = Field(..., description="Suma de ventas netas de ventas válidas en Bolivia")
    cantidad_ordenes: int = Field(..., description="Conteo de tickets/ventas válidas emitidas")
    ticket_medio: float = Field(..., description="Ingresos Totales / Cantidad de Órdenes")

    # Desgloses y Estructuras Analíticas
    desglose_sucursales: List[DesgloseSucursalBI] = []
    ventas_por_hora: List[HourlyDistributionItemBI] = []
    ventas_recientes: List[VentaRecienteBI] = []
    resumen_operativo: ResumenOperativoBI = Field(default_factory=ResumenOperativoBI)
    alertas_operativas: List[AlertaOperativaBI] = []

    # Trazabilidad
    trazabilidad: Dict[str, Any] = Field(
        default_factory=lambda: {
            "fuente": "MongoDB.sales",
            "modelo_analitico": "Star Schema (FACT_VENTAS)",
            "filtro_anuladas": "anulada != True",
            "regla_estados_pago": ["PAGADO", "PENDIENTE", "PARCIAL"]
        }
    )


# ─── SCHEMAS PARA LA SECCIÓN 2: COMPARATIVAS HISTÓRICAS (DoD / WoW / MoM / YoY) ───

class PeriodoMetricBI(BaseModel):
    start_date: str
    end_date: str
    ingresos: float = 0.0
    ordenes: int = 0
    ticket_medio: float = 0.0


class VariacionMetricBI(BaseModel):
    diferencia_ingresos: float = 0.0
    variacion_ingresos_pct: Optional[float] = None
    estado_ingresos: str = "OK"  # 'CRECIMIENTO' | 'DECRECIMIENTO' | 'SIN_CAMBIO' | 'SIN_BASE_COMPARATIVA'

    diferencia_ordenes: int = 0
    variacion_ordenes_pct: Optional[float] = None
    estado_ordenes: str = "OK"

    diferencia_ticket: float = 0.0
    variacion_ticket_pct: Optional[float] = None
    estado_ticket: str = "OK"


class SerieTiempoItemBI(BaseModel):
    fecha_bolivia: str
    dia_semana: str
    ingresos: float = 0.0
    ordenes: int = 0
    ticket_medio: float = 0.0


class DesgloseSucursalComparativaBI(BaseModel):
    sucursal_id: str
    nombre_sucursal: str
    ingresos_actual: float = 0.0
    ingresos_comparativo: float = 0.0
    variacion_ingresos_pct: Optional[float] = None
    ordenes_actual: int = 0
    ordenes_comparativo: int = 0
    variacion_ordenes_pct: Optional[float] = None
    ticket_medio_actual: float = 0.0
    ticket_medio_comparativo: float = 0.0


class BIComparativaResponse(BaseModel):
    status: str = "success"
    timezone: str = "America/La_Paz"
    modo_comparativo: str  # 'ayer' | 'semana_anterior' | 'mes_anterior' | 'ano_anterior'
    ultima_actualizacion: str

    periodo_actual: PeriodoMetricBI
    periodo_comparativo: PeriodoMetricBI
    variaciones: VariacionMetricBI

    serie_actual: List[SerieTiempoItemBI] = []
    serie_comparativa: List[SerieTiempoItemBI] = []
    desglose_sucursales: List[DesgloseSucursalComparativaBI] = []

    fuente: Dict[str, Any] = Field(
        default_factory=lambda: {
            "coleccion": "sales",
            "servicio": "SalesReadService",
            "modelo_analitico": "Star Schema (FACT_VENTAS)",
            "filtro_anuladas": "anulada != True"
        }
    )
