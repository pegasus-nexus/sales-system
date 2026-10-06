import sys

file_path = "backend/app/application/services/excel_import_service.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: mapping logic
old_map = """        productos_db = await Product.find(Product.tenant_id == tenant_id).to_list()
        prod_map = {p.codigo_corto: p for p in productos_db if p.codigo_corto}"""

new_map = """        productos_db = await Product.find(Product.tenant_id == tenant_id).to_list()
        prod_map = {p.codigo_corto: p for p in productos_db if p.codigo_corto}
        prod_name_map = {p.descripcion.lower().strip(): p for p in productos_db if p.descripcion}"""

content = content.replace(old_map, new_map)

# Fix 2: checking for existing
old_check = """            product_id = ""
            
            if codigo_corto in prod_map:
                p = prod_map[codigo_corto]
                product_id = str(p.id)"""

new_check = """            product_id = ""
            
            p = None
            if codigo_corto in prod_map:
                p = prod_map[codigo_corto]
            elif descripcion and descripcion.lower().strip() in prod_name_map:
                p = prod_name_map[descripcion.lower().strip()]

            if p:
                product_id = str(p.id)"""

content = content.replace(old_check, new_check)

# Fix 3: update the map when creating new
old_new = """                productos_a_insertar.append(nuevo_prod)
                prod_map[codigo_corto] = nuevo_prod
                cat_procesados += 1"""

new_new = """                productos_a_insertar.append(nuevo_prod)
                if codigo_corto:
                    prod_map[codigo_corto] = nuevo_prod
                if descripcion:
                    prod_name_map[descripcion.lower().strip()] = nuevo_prod
                cat_procesados += 1"""

content = content.replace(old_new, new_new)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated excel_import_service.py")
