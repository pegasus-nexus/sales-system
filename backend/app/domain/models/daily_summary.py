from beanie import Document
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from .base import DecimalMoney

class CategoriaVentaInfo(BaseModel):
    nombre: str
    cantidad: float
    total_ventas: DecimalMoney
    costo_total: DecimalMoney

class ProveedorVentaInfo(BaseModel):
    nombre: str
    cantidad: float
    total_ventas: DecimalMoney
    costo_total: DecimalMoney

class ProductoVentaInfo(BaseModel):
    nombre: str
    cantidad: float
    total_ventas: DecimalMoney

class HoraVentaInfo(BaseModel):
    hora: str
    total_ventas: DecimalMoney

class ResumenVentasMetodo(BaseModel):
    efectivo: DecimalMoney = DecimalMoney("0")
    qr: DecimalMoney = DecimalMoney("0")
    tarjeta: DecimalMoney = DecimalMoney("0")
    transferencia: DecimalMoney = DecimalMoney("0")
    credito: DecimalMoney = DecimalMoney("0")

class ResumenAnulaciones(BaseModel):
    cantidad: int = 0
    monto: DecimalMoney = DecimalMoney("0")

class DailySalesSummary(Document):
    """
    Materialized View / Snapshot of daily sales and cash movements.
    Industry Standard (Computed Pattern): 
    Se sella al finalizar el día o al cerrar la última caja para ser la "Single Source of Truth".
    """
    tenant_id: str
    sucursal_id: str
    fecha: str  # YYYY-MM-DD para búsquedas exactas e idempotencia
    
    # ── Métricas Generales ──
    total_bruto: DecimalMoney = DecimalMoney("0")
    total_descuentos: DecimalMoney = DecimalMoney("0")
    total_cambio: DecimalMoney = DecimalMoney("0")
    total_gastos: DecimalMoney = DecimalMoney("0")
    balance_neto: DecimalMoney = DecimalMoney("0")  # Efectivo real final (Ventas Efectivo - Cambio - Gastos)
    
    # ── Métricas de Tráfico ──
    cantidad_transacciones: int = 0
    cantidad_clientes: int = 0
    tickets_list: List[float] = [] # Para calcular percentiles P50, P90
    
    # ── Márgenes y Costos (Para Reportes Financieros) ──
    costo_total: DecimalMoney = DecimalMoney("0")
    ganancia_matriz: DecimalMoney = DecimalMoney("0") # (Costo * 15%)
    ganancia_sucursal: DecimalMoney = DecimalMoney("0") # (Ventas - Costo - Ganancia Matriz)
    
    # ── Desgloses ──
    por_metodo: ResumenVentasMetodo = Field(default_factory=ResumenVentasMetodo)
    anuladas: ResumenAnulaciones = Field(default_factory=ResumenAnulaciones)
    
    # ── Datos para BI (Business Intelligence) ──
    por_categoria: List[CategoriaVentaInfo] = []
    por_proveedor: List[ProveedorVentaInfo] = []
    top_productos: List[ProductoVentaInfo] = []
    por_hora: List[HoraVentaInfo] = []
    
    # ── Auditoría del Snapshot ──
    es_definitivo: bool = False # True si fue generado por un cierre de caja final, False si es on-the-fly pre-calculado
    generado_por_id: Optional[str] = None
    generado_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "daily_sales_summaries"
        indexes = [
            "tenant_id",
            "sucursal_id",
            "fecha",
            [("tenant_id", 1), ("sucursal_id", 1), ("fecha", 1)]
        ]
