import sys

file_path = "backend/app/application/services/conteo_fisico_service.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

import_anchor = "from app.domain.models.conteo_fisico import ConteoFisico, ConteoItem, EstadoConteo"
if "Category" not in content:
    content = content.replace(import_anchor, import_anchor + "\nfrom app.domain.models.category import Category")

fetch_anchor = "productos = await Product.find(Product.tenant_id == tenant_id, Product.is_active == True).to_list()"
fetch_new = """productos = await Product.find(Product.tenant_id == tenant_id, Product.is_active == True).to_list()
        
        categorias = await Category.find(Category.tenant_id == tenant_id).to_list()
        cat_map = {str(c.id): c.name for c in categorias}"""

content = content.replace(fetch_anchor, fetch_new)

bad_append = """            conteo_items.append(ConteoItem(
                producto_id=str(p.id),
                codigo_corto=p.codigo_corto,
                descripcion=p.descripcion,
                stock_sistema=qty,
                stock_fisico=None,
                diferencia=0.0,
                costo_unitario=costo,
                valor_diferencia=0.0
            ))"""

good_append = """            conteo_items.append(ConteoItem(
                producto_id=str(p.id),
                codigo_corto=p.codigo_corto,
                descripcion=p.descripcion,
                categoria_id=p.categoria_id,
                categoria_nombre=cat_map.get(str(p.categoria_id), "Sin Categoría"),
                proveedores=p.proveedores or [],
                stock_sistema=qty,
                stock_fisico=None,
                diferencia=0.0,
                costo_unitario=costo,
                valor_diferencia=0.0
            ))"""

content = content.replace(bad_append, good_append)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated conteo_fisico_service.py")
