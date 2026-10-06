import sys
import re

file_path = "backend/app/application/services/excel_import_service.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We need to add name checking in excel import service
pattern = re.compile(r'existing_products_map = \{p\.codigo_corto: p for p in products if p\.codigo_corto\}')
new_maps = """existing_products_map = {p.codigo_corto: p for p in products if p.codigo_corto}
        existing_names_map = {p.descripcion.strip().lower(): p for p in products if p.descripcion}"""

content = content.replace('existing_products_map = {p.codigo_corto: p for p in products if p.codigo_corto}', new_maps)

# And in the insertion loop
old_insert = """if codigo_corto in prod_map:
                p = prod_map[codigo_corto]"""

# wait, the variable in import_products is existing_products_map or prod_map?
# Ah, I should check the exact variable name.
