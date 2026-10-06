
import os

schema_path = "backend/app/domain/schemas/product.py"
with open(schema_path, "r", encoding="utf-8") as f:
    schema_data = f.read()

if "sucursales_permitidas: Optional[List[str]] = []" not in schema_data:
    schema_data = schema_data.replace(
        "precios_sucursales: Optional[dict[str, float]] = None",
        "precios_sucursales: Optional[dict[str, float]] = None\n    sucursales_permitidas: Optional[List[str]] = []"
    )
    with open(schema_path, "w", encoding="utf-8") as f:
        f.write(schema_data)
print("Schemas Option C patched.")

