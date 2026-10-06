import sys
import re

file_path = "backend/app/application/services/conteo_fisico_service.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

bad_mapping = """                producto_id=i.producto_id,
                codigo_corto=i.codigo_corto,
                descripcion=i.descripcion,
                stock_sistema=i.stock_sistema,
                stock_fisico=i.stock_fisico,
                diferencia=i.diferencia,
                costo_unitario=i.costo_unitario,
                valor_diferencia=i.valor_diferencia"""

good_mapping = """                producto_id=i.producto_id,
                codigo_corto=i.codigo_corto,
                descripcion=i.descripcion,
                categoria_id=i.categoria_id,
                categoria_nombre=i.categoria_nombre,
                proveedores=i.proveedores,
                stock_sistema=i.stock_sistema,
                stock_fisico=i.stock_fisico,
                diferencia=i.diferencia,
                costo_unitario=i.costo_unitario,
                valor_diferencia=i.valor_diferencia"""

content = content.replace(bad_mapping, good_mapping)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed schema mappings")
