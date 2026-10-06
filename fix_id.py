import sys

file_path = "frontend/src/pages/ControlInventarioPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("key={s.sucursal_id} value={s.sucursal_id}", "key={s._id} value={s._id}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed sucursal_id to _id")
