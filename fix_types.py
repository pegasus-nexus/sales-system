import os
import re

types_path = "frontend/src/api/types.ts"
with open(types_path, "r", encoding="utf-8") as f:
    data = f.read()

data = data.replace("permisos_especiales?: Record<string, boolean>;", "permisos_especiales?: string[];")

data = re.sub(r"sucursales_permitidas\?: string\[\];\s*sucursales_permitidas\?: string\[\];", "sucursales_permitidas?: string[];", data)

with open(types_path, "w", encoding="utf-8") as f:
    f.write(data)
