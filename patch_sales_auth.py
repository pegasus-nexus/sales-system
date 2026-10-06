import os

path = "backend/app/api/v1/endpoints/sales.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """    allowed_roles = [UserRole.SUPERADMIN, UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.ADMIN_SUCURSAL, UserRole.CAJERO]
    if current_user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail='No tienes permisos para modificar la fecha de una venta')
        
    # If CAJERO, verify they have the special permission
    if current_user.role == UserRole.CAJERO:
        permisos = getattr(current_user, "permisos_especiales", [])
        if "EDITAR_FECHA_VENTA" not in permisos:
            raise HTTPException(status_code=403, detail='No tienes el permiso especial "EDITAR_FECHA_VENTA" asignado')"""

replacement = """    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN_MATRIZ]:
        permisos = getattr(current_user, "permisos_especiales", [])
        if "EDITAR_FECHA_VENTA" not in (permisos or []):
            raise HTTPException(status_code=403, detail='No tienes el permiso especial "EDITAR_FECHA_VENTA" asignado')"""

data = data.replace(target, replacement)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("Auth roles for /fecha in sales.py patched")
