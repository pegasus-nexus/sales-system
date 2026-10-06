import sys

file_path = "frontend/src/components/Layout.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add link to layout sidebar
anchor = "{ id: 'inventario-traslados', icon: ArrowLeftRight, label: 'Traslados', path: '/inventario-traslados', roles: ['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN_SUCURSAL', 'CAJERO'] },"
if "id: 'auditoria-inventario'" not in content:
    content = content.replace(anchor, anchor + "\n      { id: 'auditoria-inventario', icon: ClipboardList, label: 'Conteo Físico', path: '/auditoria-inventario', roles: ['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN_SUCURSAL', 'SUPERVISOR', 'CAJERO'] },")
    # Need to make sure ClipboardList is imported
    if "ClipboardList" not in content[:1000]:
        content = content.replace("ArrowLeftRight,", "ArrowLeftRight, ClipboardList,")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added Conteo Físico to Layout sidebar")
