import os

path = "backend/app/api/v1/endpoints/inventario.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """from datetime import datetime"""
if "from datetime import datetime, timezone" not in data:
    data = data.replace(target, """from datetime import datetime, timezone""")

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("inventario.py timezone patched")
