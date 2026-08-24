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
