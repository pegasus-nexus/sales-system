import os
path = "frontend/src/components/FinancialDetailView.tsx"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

old_chart = '''                                    <AreaChart data={report}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} tickFormatter={(v) => \Bs. \\} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                            formatter={(value) => \Bs. \\}
                                        />
                                        <Legend verticalAlign="top" height={36}/>
                                        <Area type="monotone" dataKey="margen_total" name="Margen Total" stroke="#818cf8" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="margen_distribuidor" name="Comisin Matriz" stroke="#10b981" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                                    </AreaChart>'''

new_chart = '''                                    <ComposedChart data={report}>
                                        <defs>
                                            <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} tickFormatter={(v) => \Bs. \\} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                            formatter={(value) => \Bs. \\}
                                        />
                                        <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}} />
                                        <Area type="monotone" dataKey="total_publico" name="Ventas Totales" stroke="#6366f1" fillOpacity={1} fill="url(#colorVentas)" strokeWidth={2} />
                                        <Line type="monotone" dataKey="margen_total" name="Margen Total" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                                        <Line type="monotone" dataKey="margen_retail" name="Margen Retail" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                                        <Line type="monotone" dataKey="margen_distribuidor" name="Utilidad 15%" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                                    </ComposedChart>'''

data = data.replace(old_chart.replace("", "ó"), new_chart)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
