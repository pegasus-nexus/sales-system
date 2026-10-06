import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix typo
content = content.replace("Evolucin Anual", "Evolución Anual")

# Fix Margen Cliente color from #cbd5e1 to #64748b (slate-500)
content = content.replace('fill="#cbd5e1"', 'fill="#64748b"')
content = content.replace('stroke="#cbd5e1"', 'stroke="#64748b"')

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated chart colors")
