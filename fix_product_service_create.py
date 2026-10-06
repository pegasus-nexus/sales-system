import sys
import re

file_path = "backend/app/application/services/product_service.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Using regex to find the create_product validation
pattern_create = re.compile(r'# Validate codigo_corto uniqueness within tenant.*?raise HTTPException\(status_code=400, detail=f"El c.*?digo corto \'{data\.codigo_corto}\' ya existe en tu cat.*?logo"\)', re.DOTALL)

new_create = """# Validate codigo_corto uniqueness within tenant
        if data.codigo_corto:
            existing = await Product.find_one(
                Product.tenant_id == tenant_id,
                Product.codigo_corto == data.codigo_corto,
                Product.is_active == True
            )
            if existing:
                raise HTTPException(status_code=400, detail=f"El código corto '{data.codigo_corto}' ya existe en tu catálogo")

        # Validate descripcion uniqueness within tenant (case-insensitive)
        if data.descripcion:
            existing_name = await Product.find_one(
                Product.tenant_id == tenant_id,
                Product.is_active == True,
                {"descripcion": {"$regex": f"^{data.descripcion.strip()}$", "$options": "i"}}
            )
            if existing_name:
                raise HTTPException(status_code=400, detail=f"El producto con nombre '{data.descripcion}' ya existe en tu catálogo")"""

content = pattern_create.sub(new_create, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated product_service.py correctly")
