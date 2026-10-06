import re

with open('backend/app/api/v1/endpoints/sales.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_check = '''# If CAJERO, verify their sucursal is a supermarket
    if current_user.role == UserRole.CAJERO:
        from app.domain.models.sucursal import Sucursal
        if not current_user.sucursal_id:
            raise HTTPException(status_code=403, detail='No tienes permisos (sin sucursal asignada)')
        suc = await Sucursal.get(current_user.sucursal_id)
        if not suc or "supermercado" not in str(suc.nombre).lower():
            raise HTTPException(status_code=403, detail='Solo los cajeros de supermercado pueden cambiar la fecha')'''

new_check = '''# If CAJERO, verify they have the special permission
    if current_user.role == UserRole.CAJERO:
        permisos = getattr(current_user, "permisos_especiales", [])
        if "EDITAR_FECHA_VENTA" not in permisos:
            raise HTTPException(status_code=403, detail='No tienes el permiso especial "EDITAR_FECHA_VENTA" asignado')'''

if old_check in content:
    content = content.replace(old_check, new_check)
    with open('backend/app/api/v1/endpoints/sales.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched sales.py endpoint")
else:
    print("Could not find block")
