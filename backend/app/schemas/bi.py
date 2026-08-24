from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DesgloseSucursalBI(BaseModel):
    sucursal_id: str
    nombre_sucursal: str
    ingresos: float = 0.0
    ordenes: int = 0
    ticket_medio: float = 0.0


class HourlyDistributionItemBI(BaseModel):
    hora: int
    rango: str
    ingresos: float = 0.0
    ordenes: int = 0


class BIPanelGeneralResponse(BaseModel):
    fecha_inicio_bolivia: str
    fecha_fin_bolivia: str
    timezone: str = "America/La_Paz"
    estado_sincronizacion: str = "Sincronizado"
    ultima_actualizacion: str
    
    # KPIs Principales Trazables
    ingresos_totales: float = Field(..., description="Suma de venta neta de ventas válidas en Bolivia")
    cantidad_ordenes: float = Field(..., description="Conteo de tickets/ventas válidas emitidas")
    ticket_medio: float = Field(..., description="Ingresos Totales / Cantidad de Órdenes")
    
    # Desglose Dimensional
    desglose_sucursales: List[DesgloseSucursalBI] = []
    ventas_por_hora: List[HourlyDistributionItemBI] = []
    
    # Trazabilidad
    trazabilidad: Dict[str, Any] = Field(
        default_factory=lambda: {
            "fuente": "MongoDB.sales",
            "modelo_analitico": "Star Schema (FACT_VENTAS)",
            "filtro_anuladas": "anulada != True",
            "regla_estados_pago": ["PAGADO", "PENDIENTE", "PARCIAL"]
        }
    )
