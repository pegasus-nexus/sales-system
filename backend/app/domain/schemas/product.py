"""
Pydantic schemas for the Products domain.

These were previously defined inline inside the endpoint file.
Moving them here allows:
  - Independent PRs for schema vs endpoint changes
  - Reuse across multiple endpoints or services
  - Cleaner, shorter endpoint files
"""

from typing import Optional, List
from pydantic import BaseModel
from app.domain.models.product import TipoItem


class ProductCreate(BaseModel):
    descripcion: str
    categoria_id: str
    precio_venta: float
    costo_producto: float = 0.0
    proveedor: Optional[str] = None
    proveedores: Optional[List[str]] = None
    codigo_largo: Optional[str] = None
    codigo_corto: Optional[str] = None
    image_url: Optional[str] = None
    precios_sucursales: Optional[dict[str, float]] = None
    sucursales_permitidas: Optional[List[str]] = []
    meal_plan_template_id: Optional[str] = None
    tipo_item: Optional[TipoItem] = TipoItem.FISICO
    show_on_web: Optional[bool] = True
    is_destacado: Optional[bool] = False
    # Variantes Odoo Style
    parent_id: Optional[str] = None
    is_variant: Optional[bool] = False
    has_variants: Optional[bool] = False
    atributos: Optional[dict[str, str]] = None
    variantes_resumen: Optional[List[dict]] = None
    variantes_payload: Optional[List[dict]] = None


class ProductUpdate(BaseModel):
    descripcion: Optional[str] = None
    categoria_id: Optional[str] = None
    precio_venta: Optional[float] = None
    costo_producto: Optional[float] = None
    proveedor: Optional[str] = None
    proveedores: Optional[List[str]] = None
    codigo_largo: Optional[str] = None
    codigo_corto: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    precios_sucursales: Optional[dict[str, float]] = None
    sucursales_permitidas: Optional[List[str]] = []
    meal_plan_template_id: Optional[str] = None
    tipo_item: Optional[TipoItem] = None
    show_on_web: Optional[bool] = None
    is_destacado: Optional[bool] = None
    parent_id: Optional[str] = None
    is_variant: Optional[bool] = None
    has_variants: Optional[bool] = None
    atributos: Optional[dict[str, str]] = None
    variantes_resumen: Optional[List[dict]] = None
    variantes_payload: Optional[List[dict]] = None
