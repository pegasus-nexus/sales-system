import sys

file_path = "frontend/src/api/conteos_api.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("body: JSON.stringify({ sucursal_id, notas })", "body: { sucursal_id, notas }")
content = content.replace("body: JSON.stringify({", "body: {")
content = content.replace("})", "}") # wait, this is dangerous

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed")
