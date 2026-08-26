from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class KPIRentabilidadBI(BaseModel):
    ingresos_totales: float = 0.0
    costo_directo_total: float = 0.0
    margen_bruto_teorico_bs: float = 0.0
    margen_bruto_teorico_pct: float = 0.0
    total_lineas_procesadas: int = 0
    producto_mayor_margen_nombre: str = "Sin datos"
    producto_mayor_margen_monto: float = 0.0


class CategoriaRentabilidadItemBI(BaseModel):
    categoria_nombre: str
    ingresos_bs: float = 0.0
    costos_bs: float = 0.0
    margen_bruto_bs: float = 0.0
    margen_bruto_pct: float = 0.0


class ProductoRentabilidadItemBI(BaseModel):
    producto_id: str
    nombre: str
    categoria_nombre: str = "Sin Categoría"
    unidades_vendidas: float = 0.0
    ingresos_bs: float = 0.0
    costos_bs: float = 0.0
    margen_bruto_bs: float = 0.0
    margen_bruto_pct: float = 0.0


class BIRentabilidadMargenResponse(BaseModel):
    status: str = "success"
    fecha_inicio_bolivia: str
    fecha_fin_bolivia: str
    timezone: str = "America/La_Paz"
    ultima_actualizacion: str

    kpis: KPIRentabilidadBI
    categorias: List[CategoriaRentabilidadItemBI] = []
    top_productos: List[ProductoRentabilidadItemBI] = []

    trazabilidad: Dict[str, Any] = Field(
        default_factory=lambda: {
            "fuente": "MongoDB.sales.items[] & db.products",
            "servicio": "RentabilidadBIService (Clean Architecture)",
            "modelo_analitico": "Star Schema (FACT_RENTABILIDAD_ITEMS)",
            "formula_margen": "SUM(subtotal) - SUM(cantidad * costo_producto)",
            "gastos_operativos": "NO_DISPONIBLE (Sin registros de gastos fijos/salarios en MongoDB)"
        }
    )
