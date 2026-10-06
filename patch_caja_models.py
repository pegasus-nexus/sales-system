import os
import re

path = 'backend/app/domain/models/caja.py'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target = '''class CajaGastoCategoria(Document, SoftDeleteMixin):
    """User-defined expense categories (e.g. 'Pasajes', 'Limpieza')."""
    tenant_id:   str
    nombre:      str
    descripcion: Optional[str] = None
    icono:       Optional[str] = "receipt"   # lucide icon name
    created_at:  datetime = Field(default_factory=datetime.utcnow)'''

replacement = '''class CajaGastoCategoria(Document, SoftDeleteMixin):
    """User-defined expense categories (e.g. 'Pasajes', 'Limpieza')."""
    tenant_id:   str
    nombre:      str
    descripcion: Optional[str] = None
    icono:       Optional[str] = "receipt"   # lucide icon name
    partida:     Optional[str] = None        # e.g. "01" or "010001" for accounting integration
    padre_id:    Optional[str] = None        # Optional parent ID for subcategories
    created_at:  datetime = Field(default_factory=datetime.utcnow)'''

data = data.replace(target, replacement)

target2 = '''class CajaMovimiento(Document):
    """Single cash movement within a session."""
    tenant_id:    str
    sucursal_id:  str
    sesion_id:    str                           # FK -> CajaSesion
    cajero_id:    str
    cajero_name:  str
    subtipo:      SubtipoMovimiento
    # INGRESO = cash coming IN;  EGRESO = cash going OUT
    tipo:         str                           # "INGRESO" | "EGRESO"
    monto:        DecimalMoney
    descripcion:  str
    categoria_id: Optional[str] = None         # for GASTO
    sale_id:      Optional[str] = None         # for VENTA_EFECTIVO / CAMBIO
    fecha:        datetime = Field(default_factory=datetime.utcnow)'''

replacement2 = '''class CajaMovimiento(Document):
    """Single cash movement within a session."""
    tenant_id:    str
    sucursal_id:  str
    sesion_id:    str                           # FK -> CajaSesion
    cajero_id:    str
    cajero_name:  str
    subtipo:      SubtipoMovimiento
    # INGRESO = cash coming IN;  EGRESO = cash going OUT
    tipo:         str                           # "INGRESO" | "EGRESO"
    monto:        DecimalMoney
    descripcion:  str
    categoria_id: Optional[str] = None         # for GASTO (Category)
    subcategoria_id: Optional[str] = None      # for GASTO (Subcategory - optional)
    sale_id:      Optional[str] = None         # for VENTA_EFECTIVO / CAMBIO
    fecha:        datetime = Field(default_factory=datetime.utcnow)'''

data = data.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("Caja models updated.")
