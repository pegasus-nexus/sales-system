import sys

file_path = "backend/app/application/services/conteo_fisico_service.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

bad_new_item = """            new_items.append(ConteoItem(
                producto_id=item_req.producto_id,
                codigo_corto=item_req.codigo_corto,
                descripcion=item_req.descripcion,
                stock_sistema=item_req.stock_sistema,
                stock_fisico=item_req.stock_fisico,
                diferencia=diff,
                costo_unitario=item_req.costo_unitario,
                valor_diferencia=val_diff
            ))"""

good_new_item = """            new_items.append(ConteoItem(
                producto_id=item_req.producto_id,
                codigo_corto=item_req.codigo_corto,
                descripcion=item_req.descripcion,
                categoria_id=item_req.categoria_id,
                categoria_nombre=item_req.categoria_nombre,
                proveedores=item_req.proveedores,
                stock_sistema=item_req.stock_sistema,
                stock_fisico=item_req.stock_fisico,
                diferencia=diff,
                costo_unitario=item_req.costo_unitario,
                valor_diferencia=val_diff
            ))"""

content = content.replace(bad_new_item, good_new_item)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed guardar_progreso wiping out fields")
