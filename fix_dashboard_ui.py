import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Change the labels in charts
content = content.replace('name="Margen Dist. (15%)"', 'name="Margen Distribuidor"')
content = content.replace('name="Margen Cliente (85%)"', 'name="Margen Cliente"')

# Render online dot
old_personnel_ui = """                                                <div>
                                                    <p className="font-bold text-gray-900">{emp.nombre}</p>
                                                    <p className="text-xs text-gray-500">{emp.transacciones} transacciones hoy</p>
                                                </div>"""

new_personnel_ui = """                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-gray-900">{emp.nombre}</p>
                                                        {emp.is_online ? (
                                                            <span className="flex h-2 w-2 relative">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <p className="text-xs text-gray-500">{emp.transacciones} transacciones hoy</p>
                                                </div>"""

content = content.replace(old_personnel_ui, new_personnel_ui)

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated frontend UI")
