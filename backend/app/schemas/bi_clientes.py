from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class KPIClientesBI(BaseModel):
    ingresos_totales: float = 0.0
    total_tickets: int = 0
    ventas_nominadas_monto: float = 0.0
    ventas_nominadas_tickets: int = 0
    ventas_anonimas_monto: float = 0.0
    ventas_anonimas_tickets: int = 0
    top_cliente_nombre: str = "Sin datos"
    top_cliente_monto: float = 0.0


class MetodoPagoItemBI(BaseModel):
    metodo: str
    monto_neto: float = 0.0
    tickets_conteo: int = 0
    participacion_pct: float = 0.0


class TopClienteItemBI(BaseModel):
    cliente_id: str
    nombre: str
    nit_ci: str = "Sin NIT/CI"
    compras_conteo: int = 0
    monto_total: float = 0.0
    participacion_pct: float = 0.0


class ResumenCreditoBI(BaseModel):
    total_cuentas_credito: int = 0
    saldo_total_cartera: float = 0.0
    cuentas_al_dia: int = 0
    cuentas_mora: int = 0


class BIClientesResponse(BaseModel):
    status: str = "success"
    fecha_inicio_bolivia: str
    fecha_fin_bolivia: str
    timezone: str = "America/La_Paz"
    ultima_actualizacion: str

    kpis: KPIClientesBI
    metodos_pago: List[MetodoPagoItemBI] = []
    top_clientes: List[TopClienteItemBI] = []
    resumen_credito: ResumenCreditoBI = Field(default_factory=ResumenCreditoBI)

    trazabilidad: Dict[str, Any] = Field(
        default_factory=lambda: {
            "fuente": "MongoDB.sales & db.clientes",
            "servicio": "ClientesBIService (Clean Architecture)",
            "modelo_analitico": "Star Schema (FACT_PAGOS & FACT_CLIENTES)",
            "filtro_anuladas": "anulada != True",
            "formula_pagos_netos": "sales.total * (monto_metodo / monto_total_ticket)"
        }
    )
