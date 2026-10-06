import os

path = 'backend/app/application/services/product_service.py'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target = '''        tenant_id = current_user.tenant_id or "default"
    
        # Validate category belongs to tenant'''

replacement = '''        tenant_id = current_user.tenant_id or "default"
        
        # Free trial product limit validation (max 100)
        from app.domain.models.tenant import Tenant, PlanType
        tenant = await Tenant.get(tenant_id)
        if tenant and tenant.plan == PlanType.BASICO:
            product_count = await Product.find({"tenant_id": tenant_id, "is_active": True}).count()
            if product_count >= 100:
                raise HTTPException(status_code=403, detail="El plan gratuito permite un máximo de 100 productos. Actualiza tu plan para crear más.")
    
        # Validate category belongs to tenant'''

data = data.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)
print("Product limit patched")
