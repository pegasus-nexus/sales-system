import re

with open("backend/app/api/v1/endpoints/comunidad.py", "r", encoding="utf-8") as f:
    content = f.read()

new_endpoint = """
@router.get("/premios-uso")
async def get_premios_uso(current_user: User = Depends(get_current_active_user)):
    \"\"\"
    Devuelve un diccionario con el ID del premio y cuántas veces ha sido canjeado.
    \"\"\"
    if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.SUPERADMIN]:
         raise HTTPException(status_code=403, detail="No tienes permisos")
         
    tenant_id = current_user.tenant_id or "default"
    return await ComunidadService.get_premios_uso(tenant_id)

@router.get("/stats")
"""

content = content.replace("@router.get(\"/stats\")", new_endpoint)

with open("backend/app/api/v1/endpoints/comunidad.py", "w", encoding="utf-8") as f:
    f.write(content)
