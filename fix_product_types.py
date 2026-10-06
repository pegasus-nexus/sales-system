
import os

types_path = "frontend/src/api/types.ts"
with open(types_path, "r", encoding="utf-8") as f:
    types_data = f.read()

types_data = types_data.replace(
    "precios_sucursales?: Record<string, number>; // sucursal_id -> branch specific price",
    "precios_sucursales?: Record<string, number>; // sucursal_id -> branch specific price\n    sucursales_permitidas?: string[];"
)

types_data = types_data.replace(
    "precios_sucursales?: Record<string, number>;",
    "precios_sucursales?: Record<string, number>;\n    sucursales_permitidas?: string[];"
)

with open(types_path, "w", encoding="utf-8") as f:
    f.write(types_data)

print("Product types patched.")

