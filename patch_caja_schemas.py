import os

path = 'backend/app/domain/schemas/caja.py'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target_gasto = '''class GastoIn(BaseModel):
    """Request body to register a manual expense."""
    monto: float
    descripcion: str
    categoria_id: Optional[str] = None'''

replacement_gasto = '''class GastoIn(BaseModel):
    """Request body to register a manual expense."""
    monto: float
    descripcion: Optional[str] = "Sin descripción"
    categoria_id: Optional[str] = None
    subcategoria_id: Optional[str] = None'''

data = data.replace(target_gasto, replacement_gasto)

target_cat = '''class CategoriaGastoIn(BaseModel):
    """Request body to create an expense category."""
    nombre: str
    descripcion: Optional[str] = None
    icono: Optional[str] = "receipt"'''

replacement_cat = '''class CategoriaGastoIn(BaseModel):
    """Request body to create an expense category."""
    nombre: str
    descripcion: Optional[str] = None
    icono: Optional[str] = "receipt"
    partida: Optional[str] = None
    padre_id: Optional[str] = None'''

data = data.replace(target_cat, replacement_cat)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("Caja schemas updated.")
