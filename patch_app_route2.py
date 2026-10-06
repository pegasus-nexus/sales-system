with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_route = '''customCondition={['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL'].includes(useAuthStore().role || '') || !!useAuthStore().user?.permisos_especiales?.includes('INGRESO_HISTORICO_INVENTARIO')}'''

new_route = '''customCondition={['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL'].includes(useAuthStore.getState().role || '') || !!useAuthStore.getState().user?.permisos_especiales?.includes('INGRESO_HISTORICO_INVENTARIO')}'''

content = content.replace(old_route, new_route)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched App.tsx route again")
