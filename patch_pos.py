with open('frontend/src/pages/POSPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = '''const esSupermercado = sucursales.find(s => s._id === sucursalId)?.nombre.toLowerCase().includes('supermercado');'''
new_logic = '''const canEditDate = user?.permisos_especiales?.includes('EDITAR_FECHA_VENTA') || ['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL'].includes(user?.role || '');'''
content = content.replace(old_logic, new_logic)

content = content.replace('{esSupermercado && (', '{canEditDate && (')

with open('frontend/src/pages/POSPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched POSPage.tsx")
