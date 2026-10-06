import os

path = "frontend/src/pages/VentasPage.tsx"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """{!isAnulado && (user?.permisos_especiales?.includes('EDITAR_FECHA_VENTA') || ['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL'].includes(user?.role || '')) && ("""
replacement = """{!isAnulado && (user?.permisos_especiales?.includes('EDITAR_FECHA_VENTA') || ['SUPERADMIN', 'ADMIN_MATRIZ'].includes(user?.role || '')) && ("""

data = data.replace(target, replacement)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("VentasPage.tsx patched")
