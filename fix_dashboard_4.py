import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

diario_chart = """<h2 className="text-xl font-bold text-gray-900 mb-6">Ventas Diarias (Mes Actual)</h2>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metrics.grafico_diario} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>"""

new_diario_chart = """<div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Ventas Diarias (Mes Actual)</h2>
                                <select 
                                    value={filterDiario}
                                    onChange={(e) => setFilterDiario(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 outline-none text-xs font-bold text-gray-700 rounded-lg px-2 py-1 cursor-pointer"
                                >
                                    <option value="all">Todas las Sucursales</option>
                                    {sucursales.map(s => <option key={s._id} value={s._id}>{s.nombre}</option>)}
                                </select>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metricsDiario.grafico_diario} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>"""
content = content.replace(diario_chart, new_diario_chart)

# Also fix the bottom lists to use metricsHoy
content = content.replace("metrics.productos_mas_vendidos", "metricsHoy.productos_mas_vendidos")
content = content.replace("metrics.personal_activo", "metricsHoy.personal_activo")

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Line chart and lists")
