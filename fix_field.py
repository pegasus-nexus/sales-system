import sys

file_path = "backend/app/domain/schemas/conteo_fisico.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("from pydantic import BaseModel", "from pydantic import BaseModel, Field")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Added Field import")
