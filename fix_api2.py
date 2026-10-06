import sys

file_path = "frontend/src/api/conteos_api.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

bad_ts = """export interface ConteoItem {
    producto_id: string;
    codigo_corto?: string;
    descripcion?: string;
    stock_sistema: number;
    stock_fisico: number | null;
    diferencia: number;
    costo_unitario: number;
    valor_diferencia: number;
}"""

good_ts = """export interface ConteoItem {
    producto_id: string;
    codigo_corto?: string;
    descripcion?: string;
    categoria_id?: string;
    categoria_nombre?: string;
    proveedores?: string[];
    stock_sistema: number;
    stock_fisico: number | null;
    diferencia: number;
    costo_unitario: number;
    valor_diferencia: number;
}"""

content = content.replace(bad_ts, good_ts)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated conteos_api.ts")
