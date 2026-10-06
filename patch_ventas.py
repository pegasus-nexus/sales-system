with open('frontend/src/pages/VentasPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = '''{!isAnulado && (sucursales.find(s => s._id === venta.sucursal_id)?.nombre || "").toLowerCase().includes("supermercado") && ('''
new_logic = '''{!isAnulado && (user?.permisos_especiales?.includes('EDITAR_FECHA_VENTA') || ['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL'].includes(user?.role || '')) && ('''

content = content.replace(old_logic, new_logic)

with open('frontend/src/pages/VentasPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched VentasPage.tsx")
