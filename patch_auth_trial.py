import os

path = 'backend/app/infrastructure/auth.py'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target = '''async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user'''

replacement = '''async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    # Free Trial Validation (14 days hard limit)
    if current_user.tenant_id and current_user.role != UserRole.SUPERADMIN:
        from app.domain.models.tenant import Tenant, PlanType
        tenant = await Tenant.get(current_user.tenant_id)
        if tenant and tenant.plan == PlanType.BASICO:
            from datetime import timedelta
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            # Make sure created_at is aware
            created_at = tenant.created_at
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
                
            if now > created_at + timedelta(days=14):
                raise HTTPException(
                    status_code=402, 
                    detail="Tu prueba gratuita de 14 días ha expirado. Por favor, actualiza tu plan para continuar."
                )

    return current_user'''

data = data.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)
print("Auth free trial patched")
