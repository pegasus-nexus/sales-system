from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class KPISucursalesBI(BaseModel):
    ingresos_totales: float = 0.0
    total_tickets: int = 0
    ticket_medio_global: float = 0.0
    total_sucursales_activas_con_venta: int = 0
    sucursal_lider_nombre: str = "Sin datos"
    sucursal_lider_ingresos: float = 0.0
    sucursal_mayor_ticket_medio_nombre: str = "Sin datos"
    sucursal_mayor_ticket_medio_monto: float = 0.0


class SucursalDesempenoItemBI(BaseModel):
    sucursal_id: str
    nombre: str
    ciudad: str = "Sin Ciudad"
    direccion: str = ""
    is_active: bool = True
    tickets_conteo: int = 0
    ingresos_bs: float = 0.0
    ticket_medio: float = 0.0
    participacion_pct: float = 0.0


class BISucursalesDesempenoResponse(BaseModel):
    status: str = "success"
    fecha_inicio_bolivia: str
    fecha_fin_bolivia: str
    timezone: str = "America/La_Paz"
    ultima_actualizacion: str

    kpis: KPISucursalesBI
    sucursales: List[SucursalDesempenoItemBI] = []

    trazabilidad: Dict[str, Any] = Field(
        default_factory=lambda: {
            "fuente": "MongoDB.sales & db.sucursales",
            "servicio": "SucursalesBIService (Clean Architecture)",
            "modelo_analitico": "Star Schema (FACT_SALES_SUCURSALES)",
            "filtro_anuladas": "anulada != True",
            "formula_ingreso": "SUM(sales.total) por sucursal_id"
        }
    )
