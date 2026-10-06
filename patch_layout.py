import os

path = "frontend/src/components/Layout.tsx"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """{ icon: History, label: 'Ingreso Histórico', path: '/compras/historico', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', ...(user?.permisos_especiales?.includes('INGRESO_HISTORICO_INVENTARIO') ? ['CAJERO', 'VENDEDOR', 'FACTURADOR', 'SUPERVISOR'] : [])] },"""
replacement = """{ icon: History, label: 'Ingreso Histórico', path: '/compras/historico', feature: 'INVENTARIO', roles: ['SUPERADMIN', 'ADMIN_MATRIZ', ...(user?.permisos_especiales?.includes('INGRESO_HISTORICO_INVENTARIO') ? ['ADMIN', 'ADMIN_SUCURSAL', 'CAJERO', 'VENDEDOR', 'FACTURADOR', 'SUPERVISOR'] : [])] },"""

data = data.replace(target.replace('ó', 'o'), replacement.replace('ó', 'o'))
data = data.replace(target, replacement)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("Layout.tsx patched")
