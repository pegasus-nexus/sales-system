import sys

with open("frontend/src/pages/VentasPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_cond = """{!isAnulado && role !== "CAJERO" && (sucursales.find(s => s._id === venta.sucursal_id)?.nombre || "").toLowerCase().includes("supermercado") && ("""
new_cond = """{!isAnulado && (sucursales.find(s => s._id === venta.sucursal_id)?.nombre || "").toLowerCase().includes("supermercado") && ("""

if old_cond in content:
    content = content.replace(old_cond, new_cond)
    with open("frontend/src/pages/VentasPage.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully updated VentasPage.tsx")
else:
    print("Could not find the condition in VentasPage.tsx!")
