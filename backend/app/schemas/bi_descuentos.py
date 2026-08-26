from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class KPIDescuentosBI(BaseModel):
    promociones_configuradas: int = 0
    promociones_activas: int = 0
    tickets_con_descuento: int = 0
    monto_total_descuentos_otorgados: float = 0.0
    promocion_mas_usada_nombre: str = "Sin datos"
    promocion_mas_usada_monto: float = 0.0


class PromocionDetalleItemBI(BaseModel):
    promocion_id: str
    nombre: str
    tipo: str = "PORCENTAJE"  # 'PORCENTAJE' | 'MONTO'
    valor: float = 0.0
    is_active: bool = True
    tickets_aplicados: int = 0
    monto_descuento_total: float = 0.0


class BIDescuentosImpactoResponse(BaseModel):
    status: str = "success"
    fecha_consulta_bolivia: str
    timezone: str = "America/La_Paz"
    ultima_actualizacion: str

    kpis: KPIDescuentosBI
    promociones: List[PromocionDetalleItemBI] = []

    trazabilidad: Dict[str, Any] = Field(
        default_factory=lambda: {
            "fuente": "MongoDB.descuentos & db.sales",
            "servicio": "DescuentosBIService (Clean Architecture)",
            "modelo_analitico": "Star Schema (FACT_DESCUENTOS_SALES)",
            "formula_descuento": "SUM(sales.descuento.monto)",
            "roi_efectividad_causal": "NO_DISPONIBLE (Sin trazabilidad causal de origen de campaña en MongoDB)"
        }
    )
