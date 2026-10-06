import os
path = "frontend/src/components/Layout.tsx"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = '''                    { icon: Package, label: 'Catlogo', path: '/catalogo', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'USER', 'SUPERVISOR', 'VENDEDOR'] },'''

replacement = '''                    { icon: Package, label: 'Catlogo', path: '/catalogo', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'USER', 'SUPERVISOR', 'VENDEDOR'] },
                    { icon: Calculator, label: 'Simulador de Mrgenes', path: '/calculadora-margenes', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] },'''

data = data.replace(target.replace("", "á"), replacement.replace("", "á"))
with open(path, "w", encoding="utf-8") as f:
    f.write(data)
