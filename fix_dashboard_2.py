import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Top Stats (metricsHoy)
content = content.replace("metrics ? (", "metricsHoy && metricsMensual && metricsDiario ? (")
content = content.replace("metrics.ventas_hoy", "metricsHoy.ventas_hoy")
content = content.replace("metrics.transacciones_ventas", "metricsHoy.transacciones_ventas")
content = content.replace("metrics.transacciones_compras", "metricsHoy.transacciones_compras")
content = content.replace("metrics.anulaciones_hoy", "metricsHoy.anulaciones_hoy")

# Add filter to Ventas Hoy
ventas_hoy_card = """<div className="flex justify-between items-start mb-4 relative">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><DollarSign size={24} /></div>
                                <button onClick={() => setShowVentasHoy(!showVentasHoy)} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white">
                                    {showVentasHoy ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                            </div>"""

new_ventas_hoy_card = """<div className="flex justify-between items-start mb-4 relative">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><DollarSign size={24} /></div>
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={filterHoy}
                                        onChange={(e) => setFilterHoy(e.target.value)}
                                        className="bg-white/10 outline-none text-xs font-bold text-white rounded-lg px-2 py-1 cursor-pointer appearance-none"
                                    >
                                        <option value="all" className="text-gray-900">Todas las Sucursales</option>
                                        {sucursales.map(s => <option key={s._id} value={s._id} className="text-gray-900">{s.nombre}</option>)}
                                    </select>
                                    <button onClick={() => setShowVentasHoy(!showVentasHoy)} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white">
                                        {showVentasHoy ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </button>
                                </div>
                            </div>"""
content = content.replace(ventas_hoy_card, new_ventas_hoy_card)

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Ventas Hoy")
