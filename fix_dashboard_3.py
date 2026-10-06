import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

mensual_chart = """<h2 className="text-xl font-bold text-gray-900 mb-6">Evolucin Anual (Mes a Mes)</h2>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={metrics.grafico_mensual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `Bs${val/1000}k`} />
                                        <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                        
                                        <Bar dataKey="margen_distribuidor" name="Margen Dist. (15%)" stackId="a" fill="#8b5cf6" radius={[0,0,4,4]} />
                                        <Bar dataKey="margen_cliente" name="Margen Cliente (85%)" stackId="a" fill="#indigo-300" radius={[4,4,0,0]} />
                                        
                                        <ReferenceLine x={metrics.grafico_mensual.find((m: any) => m.mes_index === metrics.mes_actual)?.mes} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Mes Actual', fill: '#ef4444', fontSize: 12 }} />
                                    </BarChart>
                                </ResponsiveContainer>"""

new_mensual_chart = """<div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Evolucin Anual (Mes a Mes)</h2>
                                <select 
                                    value={filterMensual}
                                    onChange={(e) => setFilterMensual(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 outline-none text-xs font-bold text-gray-700 rounded-lg px-2 py-1 cursor-pointer"
                                >
                                    <option value="all">Todas las Sucursales</option>
                                    {sucursales.map(s => <option key={s._id} value={s._id}>{s.nombre}</option>)}
                                </select>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={metricsMensual.grafico_mensual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `Bs${val/1000}k`} />
                                        <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                        
                                        <Bar dataKey="ventas_totales" name="Ventas Totales" fill="#4f46e5" radius={[4,4,0,0]} />
                                        <Bar dataKey="margen_distribuidor" name="Margen Dist. (15%)" fill="#8b5cf6" radius={[4,4,0,0]} />
                                        <Bar dataKey="margen_cliente" name="Margen Cliente (85%)" fill="#cbd5e1" radius={[4,4,0,0]} />
                                        
                                        <ReferenceLine x={metricsMensual.grafico_mensual.find((m: any) => m.mes_index === metricsMensual.mes_actual)?.mes} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Mes Actual', fill: '#ef4444', fontSize: 12 }} />
                                    </BarChart>
                                </ResponsiveContainer>"""
content = content.replace(mensual_chart, new_mensual_chart)

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Bar chart")
