from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class KPIEjecutivoBI(BaseModel):
    ingresos_totales: float = 0.0
    costo_directo_total: float = 0.0
    margen_bruto_teorico_bs: float = 0.0
    margen_bruto_teorico_pct: float = 0.0
    total_tickets: int = 0
    ticket_medio: float = 0.0

    total_unidades_stock: float = 0.0
    valorizacion_costo_stock: float = 0.0

    promociones_configuradas: int = 0
    monto_total_descuentos: float = 0.0
    tickets_con_descuento: int = 0

    sucursal_lider_nombre: str = "Sin datos"
    sucursal_lider_ingresos: float = 0.0

    cajero_lider_nombre: str = "Sin datos"
    cajero_lider_ingresos: float = 0.0


class ResumenSucursalEjecutivoBI(BaseModel):
    sucursal_id: str
    nombre: str
    ingresos_bs: float = 0.0
    tickets_conteo: int = 0
    participacion_pct: float = 0.0


class BIEjecutivoResumenResponse(BaseModel):
    status: str = "success"
    fecha_inicio_bolivia: str
    fecha_fin_bolivia: str
    timezone: str = "America/La_Paz"
    ultima_actualizacion: str

    kpis: KPIEjecutivoBI
    sucursales: List[ResumenSucursalEjecutivoBI] = []

    trazabilidad: Dict[str, Any] = Field(
        default_factory=lambda: {
            "fuente": "MongoDB (sales, products, descuentos, sucursales, audit_logs)",
            "servicio": "EjecutivoBIService (Clean Architecture)",
            "modelo_analitico": "Star Schema (CONSOLIDATED_EXECUTIVE_SUMMARY)",
            "formula_margen_bruto": "SUM(sales.total) - SUM(items.cantidad * products.costo)",
            "ebitda_gastos_operativos": "NO_DISPONIBLE (Sin libros de egresos fijos en MongoDB)",
            "rotacion_kardex": "NO_DISPONIBLE (Sin kardex continuo de almacen en MongoDB)",
            "pronosticos_ia": "NO_DISPONIBLE (Sin modelos predictivos en MongoDB)"
        }
    )
