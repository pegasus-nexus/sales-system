import sys
import re

file_path = "backend/app/domain/schemas/conteo_fisico.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

bad = """class ConteoItemSchema(BaseModel):
    producto_id: str
    codigo_corto: Optional[str] = None
    descripcion: Optional[str] = None
    stock_sistema: float
    stock_fisico: Optional[float] = None
    diferencia: float = 0.0
    costo_unitario: float = 0.0
    valor_diferencia: float = 0.0"""

good = """class ConteoItemSchema(BaseModel):
    producto_id: str
    codigo_corto: Optional[str] = None
    descripcion: Optional[str] = None
    categoria_id: Optional[str] = None
    categoria_nombre: Optional[str] = None
    proveedores: Optional[List[str]] = Field(default_factory=list)
    stock_sistema: float
    stock_fisico: Optional[float] = None
    diferencia: float = 0.0
    costo_unitario: float = 0.0
    valor_diferencia: float = 0.0"""

content = content.replace(bad, good)

# Add Field import if missing
if "Field" not in content:
    content = content.replace("from pydantic import BaseModel", "from pydantic import BaseModel, Field")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed schema!")
