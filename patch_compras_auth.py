import os

path = "backend/app/api/v1/endpoints/compras.py"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """    if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.ADMIN_SUCURSAL, UserRole.CAJERO]:
        if "INGRESO_HISTORICO_INVENTARIO" not in (current_user.permisos_especiales or []):
            raise HTTPException(status_code=403, detail="No tienes permisos especiales para ingresar historial")"""

replacement = """    if reception_in.es_historico:
        if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.SUPERADMIN]:
            if "INGRESO_HISTORICO_INVENTARIO" not in (current_user.permisos_especiales or []):
                raise HTTPException(status_code=403, detail="No tienes permisos para realizar ingresos historicos")
    else:
        if current_user.role not in [UserRole.ADMIN_MATRIZ, UserRole.ADMIN, UserRole.ADMIN_SUCURSAL, UserRole.CAJERO]:
            if "INGRESO_INVENTARIO" not in (current_user.permisos_especiales or []):
                raise HTTPException(status_code=403, detail="No tienes permisos para ingresar recepciones")"""

data = data.replace(target, replacement)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("Auth roles logic in compras.py patched")
