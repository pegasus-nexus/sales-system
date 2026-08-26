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


class BIInventarioControlResponse(BaseModel):
    status: str = "success"
    fecha_consulta_bolivia: str
    timezone: str = "America/La_Paz"
    ultima_actualizacion: str

    kpis: KPIInventarioBI
    desglose_sucursales: List[SucursalInventarioItemBI] = []
    top_productos_inventario: List[ProductoInventarioItemBI] = []

    trazabilidad: Dict[str, Any] = Field(
        default_factory=lambda: {
            "fuente": "MongoDB.inventario & db.products & db.sucursales",
            "servicio": "InventarioBIService (Clean Architecture)",
            "modelo_analitico": "Star Schema (FACT_INVENTARIO)",
            "formula_valorizacion": "SUM(inventario.cantidad * products.costo_producto)",
            "rotacion_kardex": "NO_DISPONIBLE (Sin historial continuo de movimientos de almacén en MongoDB)"
        }
    )
