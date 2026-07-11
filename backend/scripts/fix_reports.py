import re

with open('backend/app/api/v1/endpoints/reports.py', 'r', encoding='utf-8') as f:
    content = f.read()

# For get_general_reports, add sucursal_id handling
target = """    days: int = 30,
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
) -> Dict[str, Any]:"""
replacement = """    days: int = 30,
    sucursal_id: Optional[str] = "all",
    current_user: User = Depends(require_roles([UserRole.ADMIN_MATRIZ, UserRole.ADMIN_SUCURSAL]))
) -> Dict[str, Any]:"""
content = content.replace(target, replacement)

# Add overriding logic
override_logic = """tenant_id = current_user.tenant_id or "default"
    if current_user.role == UserRole.ADMIN_SUCURSAL and current_user.sucursal_id:
        sucursal_id = current_user.sucursal_id"""
content = content.replace('tenant_id = current_user.tenant_id or "default"', override_logic)

# Replace 'tenant_id': tenant_id, with spread
content = content.replace('"tenant_id": tenant_id,', '"tenant_id": tenant_id, **({"sucursal_id": sucursal_id} if "sucursal_id" in locals() and sucursal_id and sucursal_id != "all" else {}),')

with open('backend/app/api/v1/endpoints/reports.py', 'w', encoding='utf-8') as f:
    f.write(content)
