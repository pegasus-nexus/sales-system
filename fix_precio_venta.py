import sys

file_path = "backend/app/api/v1/endpoints/inventario.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('"$precio_final"', '"$precio_venta"')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed precio_venta")
