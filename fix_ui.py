import re
with open('frontend/src/pages/VentasPage.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('activeBranch?.nombre.toLowerCase().includes("supermercado")', '(sucursales.find(s => s._id === venta.sucursal_id)?.nombre || "").toLowerCase().includes("supermercado")')

with open('frontend/src/pages/VentasPage.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
