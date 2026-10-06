import sys

file_path = "backend/app/application/services/product_service.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We need to add descripcion validation in create_product
# Current create_product:
"""
        # Validate codigo_corto uniqueness within tenant
        if data.codigo_corto:
            existing = await Product.find_one(
                Product.tenant_id == tenant_id,
                Product.codigo_corto == data.codigo_corto,
            )
            if existing:
                raise HTTPException(status_code=400, detail=f"El código corto '{data.codigo_corto}' ya existe en tu catálogo")
"""

old_create = """        # Validate codigo_corto uniqueness within tenant
        if data.codigo_corto:
            existing = await Product.find_one(
                Product.tenant_id == tenant_id,
                Product.codigo_corto == data.codigo_corto,
            )
            if existing:
                raise HTTPException(status_code=400, detail=f"El cdigo corto '{data.codigo_corto}' ya existe en tu catlogo")"""

new_create = """        # Validate codigo_corto uniqueness within tenant
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
                Product.descripcion == data.descripcion,
                Product.is_active == True
            )
            # Also try case-insensitive query if exact match fails
            if not existing_name:
                existing_name = await Product.find_one(
                    Product.tenant_id == tenant_id,
                    Product.is_active == True,
                    {"descripcion": {"$regex": f"^{data.descripcion.strip()}$", "$options": "i"}}
                )
                
            if existing_name:
                raise HTTPException(status_code=400, detail=f"El producto con nombre '{data.descripcion}' ya existe en tu catálogo")"""

if old_create in content:
    content = content.replace(old_create, new_create)
else:
    print("Could not find old_create")

# Now update_product
old_update = """        product = await Product.get(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")"""

new_update = """        product = await Product.get(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
            
        # Validate codigo_corto uniqueness
        if data.codigo_corto and data.codigo_corto != product.codigo_corto:
            existing = await Product.find_one(
                Product.tenant_id == product.tenant_id,
                Product.codigo_corto == data.codigo_corto,
                Product.is_active == True
            )
            if existing and str(existing.id) != str(product.id):
                raise HTTPException(status_code=400, detail=f"El código corto '{data.codigo_corto}' ya existe")

        # Validate descripcion uniqueness
        if data.descripcion and data.descripcion != product.descripcion:
            existing_name = await Product.find_one(
                Product.tenant_id == product.tenant_id,
                Product.is_active == True,
                {"descripcion": {"$regex": f"^{data.descripcion.strip()}$", "$options": "i"}}
            )
            if existing_name and str(existing_name.id) != str(product.id):
                raise HTTPException(status_code=400, detail=f"Un producto con nombre '{data.descripcion}' ya existe")"""

if old_update in content:
    content = content.replace(old_update, new_update)
else:
    print("Could not find old_update")


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated product_service.py")
