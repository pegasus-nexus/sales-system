import sys

file_path = "frontend/src/components/Layout.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("Conteo FAsico", "Conteo Fisico")
content = content.replace("Conteo Físico", "Conteo Fisico")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed encoding issue")
