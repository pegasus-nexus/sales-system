import sys

file_path = "frontend/src/components/Layout.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

anchor = "{ icon: Warehouse, label: 'Inventario', path: '/inventario', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'USER', 'SUPERVISOR', 'VENDEDOR', 'CAJERO'] },"
new_link = "                    { icon: ClipboardList, label: 'Conteo Físico', path: '/auditoria-inventario', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERVISOR', 'CAJERO'] },"

if "/auditoria-inventario" not in content:
    content = content.replace(anchor, anchor + "\n" + new_link)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added Conteo Físico to Layout sidebar (for real this time)")
else:
    print("Already in Layout.tsx")
