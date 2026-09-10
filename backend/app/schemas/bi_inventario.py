from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class KPIInventarioBI(BaseModel):
    total_unidades_stock: float = 0.0
    valorizacion_costo_total: float = 0.0
    skus_con_stock_disponible: int = 0
    skus_agotados: int = 0
    skus_stock_bajo: int = 0
    sucursal_mayor_inventario_nombre: str = "Sin datos"
    sucursal_mayor_inventario_monto: float = 0.0
    # Métricas de Demanda Predictiva y Reabastecimiento a Futuro
    skus_sugerencia_pedido: int = 0
    unidades_sugeridas_totales: float = 0.0
    presupuesto_reabastecimiento_bs: float = 0.0


class SucursalInventarioItemBI(BaseModel):
    sucursal_id: str
    nombre: str
    ciudad: str = "Sin Ciudad"
    unidades_stock: float = 0.0
    skus_conteo: int = 0
    skus_agotados: int = 0
    valorizacion_costo: float = 0.0


class ProductoInventarioItemBI(BaseModel):
    producto_id: str
    nombre: str
    categoria_nombre: str = "Sin Categoría"
    stock_actual: float = 0.0
    costo_unitario: float = 0.0
    valor_total_costo: float = 0.0
    estado_stock: str = "OK"  # 'OK' | 'BAJO' | 'AGOTADO'
    # Campos de Demanda Predictiva y Sugerencia de Pedidos a Futuro
    velocidad_diaria_ventas: float = 0.0  # Unidades/día en los últimos 30 días
    dias_cobertura_estimados: Optional[float] = None  # Días de stock restante
    alerta_cobertura: str = "SALUDABLE"  # 'URGENTE' | 'ALERTA' | 'SALUDABLE' | 'SIN_VENTAS' | 'AGOTADO'
    sugerencia_reabastecimiento_unidades: float = 0.0  # Para cubrir 30 días
    sugerencia_monto_bs: float = 0.0  # Presupuesto estimado en Bs.


class InventoryLogItemBI(BaseModel):
    log_id: str
    producto_id: str
    descripcion: str
    tipo_movimiento: str
    cantidad_movida: float
    stock_resultante: float
    usuario_nombre: str
    fecha: str


class BIInventarioControlResponse(BaseModel):
    status: str = "success"
    fecha_consulta_bolivia: str
    timezone: str = "America/La_Paz"
    ultima_actualizacion: str

    kpis: KPIInventarioBI
    desglose_sucursales: List[SucursalInventarioItemBI] = []
    top_productos_inventario: List[ProductoInventarioItemBI] = []
    sugerencias_reabastecimiento: List[ProductoInventarioItemBI] = []
    movimientos_kardex_recientes: List[InventoryLogItemBI] = []

    trazabilidad: Dict[str, Any] = Field(
        default_factory=lambda: {
            "fuente": "MongoDB.inventario & db.products & db.sucursales & db.sales",
            "servicio": "InventarioBIService (Clean Architecture)",
            "modelo_analitico": "Star Schema (FACT_INVENTARIO + DEMANDA_PREDICTIVA)",
            "formula_valorizacion": "SUM(inventario.cantidad * products.costo_producto)",
            "formula_cobertura": "stock_actual / velocidad_diaria_ventas_30d",
            "formula_reabastecimiento": "MAX(0, (velocidad_diaria * 30) - stock_actual)",
            "rotacion_kardex": "Trazable mediante db.inventory_logs y velocidad de ventas 30 días"
        }
    )

