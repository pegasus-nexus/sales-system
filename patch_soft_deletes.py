import os
import re

files_with_delete = [
    'backend/app/api/v1/endpoints/descuentos.py',
    'backend/app/api/v1/endpoints/price_lists.py',
    'backend/app/api/v1/endpoints/recipes.py',
    'backend/app/api/v1/endpoints/saas_staff.py',
    'backend/app/api/v1/endpoints/tenants.py',
    'backend/app/application/services/sales_anulacion_service.py'
]

for filepath in files_with_delete:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Specifically for FastAPI route decorators, we DO NOT want to change @router.delete
    # So we replace .delete() and .delete_many() but not @router.delete
    
    # In saas_staff, tenants:
    content = re.sub(r'(\w+)\.delete\(\)', r'\1.soft_delete()', content)
    content = re.sub(r'(\w+)\.delete\(session=session\)', r'\1.soft_delete(session=session)', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("soft_delete patched.")
