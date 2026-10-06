import sys

file_path = "backend/app/domain/models/conteo_fisico.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

bad = """class ConteoItem(BaseModel):
    producto_id: str
    codigo_corto: Optional[str] = None
    descripcion: Optional[str] = None
    stock_sistema: float = 0.0
    stock_fisico: Optional[float] = None  # None means not counted yet
    diferencia: float = 0.0               # fisico - sistema
    costo_unitario: float = 0.0           # para saber el valor de la diferencia monetaria
    valor_diferencia: float = 0.0         # diferencia * costo_unitario"""

good = """class ConteoItem(BaseModel):
    producto_id: str
    codigo_corto: Optional[str] = None
    descripcion: Optional[str] = None
    categoria_id: Optional[str] = None
    categoria_nombre: Optional[str] = None
    proveedores: Optional[List[str]] = Field(default_factory=list)
    stock_sistema: float = 0.0
    stock_fisico: Optional[float] = None  # None means not counted yet
    diferencia: float = 0.0               # fisico - sistema
    costo_unitario: float = 0.0           # para saber el valor de la diferencia monetaria
    valor_diferencia: float = 0.0         # diferencia * costo_unitario"""

content = content.replace(bad, good)
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated ConteoItem model")
