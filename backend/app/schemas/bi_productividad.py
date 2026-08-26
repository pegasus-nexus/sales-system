from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class KPIProductividadBI(BaseModel):
    ingresos_totales: float = 0.0
    total_tickets: int = 0
    cajeros_activos_con_venta: int = 0
    cajero_lider_nombre: str = "Sin datos"
    cajero_lider_ingresos: float = 0.0
    cajero_mayor_ticket_medio_nombre: str = "Sin datos"
    cajero_mayor_ticket_medio_monto: float = 0.0
    total_eventos_auditoria: int = 0


class CajeroProductividadItemBI(BaseModel):
    cajero_nombre: str
    tickets_conteo: int = 0
    ingresos_bs: float = 0.0
    ticket_medio: float = 0.0
    participacion_pct: float = 0.0


class EventoAuditoriaItemBI(BaseModel):
    accion: str
    total_eventos: int = 0


class BIProductividadDesempenoResponse(BaseModel):
    status: str = "success"
    fecha_inicio_bolivia: str
    fecha_fin_bolivia: str
    timezone: str = "America/La_Paz"
    ultima_actualizacion: str

    kpis: KPIProductividadBI
    cajeros: List[CajeroProductividadItemBI] = []
    auditoria_eventos: List[EventoAuditoriaItemBI] = []

    trazabilidad: Dict[str, Any] = Field(
        default_factory=lambda: {
            "fuente": "MongoDB.sales.cashier_name & db.audit_logs & db.users",
            "servicio": "ProductividadBIService (Clean Architecture)",
            "modelo_analitico": "Star Schema (FACT_CASHIER_PERFORMANCE)",
            "formula_facturacion": "SUM(sales.total) GROUP BY cashier_name",
            "horas_trabajadas_eficiencia": "NO_DISPONIBLE (Sin marcado de asistencia ni reloj marcador en MongoDB)",
            "alertas_fraude": "NO_DISPONIBLE (Sin reglas de auditoria de fraude en MongoDB)"
        }
    )
