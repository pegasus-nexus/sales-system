import sys

file_path = "backend/app/api/v1/endpoints/inventario.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('"from": "Inventario",', '"from": "inventario",')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed collection name in lookup")
