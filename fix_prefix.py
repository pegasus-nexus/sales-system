import sys
import re

file_path = "backend/app/api/v1/endpoints/conteos_fisicos.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('"/conteos-fisicos"', '""')
content = content.replace('"/conteos-fisicos/iniciar"', '"/iniciar"')
content = content.replace('"/conteos-fisicos/{conteo_id}"', '"/{conteo_id}"')
content = content.replace('"/conteos-fisicos/{conteo_id}/finalizar"', '"/{conteo_id}/finalizar"')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed decorators!")
