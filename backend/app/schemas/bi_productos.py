from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class KPIProductosBI(BaseModel):
    producto_mas_vendido: str = "Sin datos"
    unidades_producto_mas_vendido: float = 0.0
    producto_mayor_recaudacion: str = "Sin datos"
    ingresos_producto_mayor_recaudacion: float = 0.0
    skus_distintos: int = 0
    unidades_promedio_por_ticket: float = 0.0


class TopProductoItemBI(BaseModel):
    producto_id: str
    nombre: str
    categoria_id: str
    categoria_nombre: str
    unidades_vendidas: float = 0.0
    ingresos_bs: float = 0.0
    precio_promedio_efectivo: float = 0.0
    participacion_pct: float = 0.0


class CategoriaProductosItemBI(BaseModel):
    categoria_id: str
    categoria_nombre: str
    unidades_vendidas: float = 0.0
    ingresos_bs: float = 0.0
    participacion_pct: float = 0.0


class BIProductosResponse(BaseModel):
    status: str = "success"
    fecha_inicio_bolivia: str
    fecha_fin_bolivia: str
    timezone: str = "America/La_Paz"
    ultima_actualizacion: str

    kpis: KPIProductosBI
    top_productos: List[TopProductoItemBI] = []
    categorias: List[CategoriaProductosItemBI] = []

    trazabilidad: Dict[str, Any] = Field(
        default_factory=lambda: {
            "fuente": "MongoDB.sales.items[]",
            "modelo_analitico": "Clean Architecture / Star Schema (FACT_SALES_ITEMS)",
            "filtro_anuladas": "anulada != True",
            "formula_ingreso": "SUM(subtotal)"
        }
    )
