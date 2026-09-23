import re

with open("frontend/src/components/Layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_desc = """{ icon: Percent, label: 'Descuentos', path: '/descuentos', feature: 'DESCUENTOS_AVANZADOS', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL'] }"""
new_desc = """{ icon: Percent, label: 'Descuentos', path: '/descuentos', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL'] }"""

content = content.replace(old_desc, new_desc)

with open("frontend/src/components/Layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Removed DESCUENTOS_AVANZADOS feature restriction from Layout.tsx")
