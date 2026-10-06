import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("No hay personal con ventas hoy.", "No hay personal activo o con ventas hoy.")

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated frontend text")
