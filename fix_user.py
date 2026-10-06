import os

types_path = "frontend/src/api/types.ts"
with open(types_path, "r", encoding="utf-8") as f:
    data = f.read()

data = data.replace(
    "is_active?: boolean;\n    is_online?: boolean;",
    "is_active?: boolean;\n    permisos_especiales?: Record<string, boolean>;\n    is_online?: boolean;"
)

data = data.replace(
    "role?: 'CAJERO' | 'SUPERVISOR' | 'VENDEDOR' | 'FACTURADOR';\n}",
    "role?: 'CAJERO' | 'SUPERVISOR' | 'VENDEDOR' | 'FACTURADOR';\n    permisos_especiales?: Record<string, boolean>;\n}"
)

with open(types_path, "w", encoding="utf-8") as f:
    f.write(data)
