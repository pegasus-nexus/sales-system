import sys

file_path = "backend/app/api/v1/endpoints/inventario.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_proj = """                        "Precio al Cliente": "$precio_venta",
                        "Costo Unitario": "$costo_producto",
                        "Stock": {"$ifNull": ["$inv.cantidad", 0.0]},
                        "Precio Total Stock": {
                            "$multiply": [
                                {"$ifNull": ["$precio_venta", 0.0]},
                                {"$ifNull": ["$inv.cantidad", 0.0]}
                            ]
                        },"""
new_proj = """                        "Precio al Cliente": {"$ifNull": ["$inv.precio_sucursal", "$precio_venta"]},
                        "Costo Unitario": "$costo_producto",
                        "Stock": {"$ifNull": ["$inv.cantidad", 0.0]},
                        "Precio Total Stock": {
                            "$multiply": [
                                {"$ifNull": ["$inv.precio_sucursal", {"$ifNull": ["$precio_venta", 0.0]}]},
                                {"$ifNull": ["$inv.cantidad", 0.0]}
                            ]
                        },"""
content = content.replace(old_proj, new_proj)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed branch specific price logic")
