import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the single selectedSucursal state
content = content.replace("const [selectedSucursal, setSelectedSucursal] = useState<string>('all');", 
    "const [filterHoy, setFilterHoy] = useState<string>('all');\n    const [filterMensual, setFilterMensual] = useState<string>('all');\n    const [filterDiario, setFilterDiario] = useState<string>('all');")

# Replace the single metrics query
old_query = """const { data: metrics, isLoading: loadingMetrics, refetch } = useQuery({ 
        queryKey: ['dashboard-matriz', selectedSucursal], 
        queryFn: () => getDashboardMatriz(selectedSucursal),
        refetchInterval: 300000 // Refresh every 5 mins
    });"""

new_query = """const { data: metricsHoy, isLoading: loadingHoy, refetch: refetchHoy } = useQuery({ queryKey: ['dashboard-matriz', filterHoy], queryFn: () => getDashboardMatriz(filterHoy), refetchInterval: 300000 });
    const { data: metricsMensual, isLoading: loadingMensual } = useQuery({ queryKey: ['dashboard-matriz', filterMensual], queryFn: () => getDashboardMatriz(filterMensual), refetchInterval: 300000 });
    const { data: metricsDiario, isLoading: loadingDiario } = useQuery({ queryKey: ['dashboard-matriz', filterDiario], queryFn: () => getDashboardMatriz(filterDiario), refetchInterval: 300000 });
    
    const loadingMetrics = loadingHoy || loadingMensual || loadingDiario;
    const refetchAll = () => { refetchHoy(); };
"""
content = content.replace(old_query, new_query)

# Remove the global filter dropdown and the refresh button
global_controls = """<div className="flex flex-wrap items-center gap-4">
                    <div className="bg-white px-4 py-2 rounded-2xl border border-gray-200/60 shadow-sm flex items-center gap-3">
                        <Store size={18} className="text-indigo-500" />
                        <select 
                            value={selectedSucursal}
                            onChange={(e) => setSelectedSucursal(e.target.value)}
                            className="bg-transparent outline-none text-sm font-bold text-gray-700 min-w-[150px] cursor-pointer"
                        >
                            <option value="all">Todas las Sucursales</option>
                            {sucursales.map(s => (
                                <option key={s._id} value={s._id}>{s.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={() => refetch()} className="p-3 bg-white text-gray-600 rounded-2xl border border-gray-200/60 shadow-sm hover:bg-gray-50 transition-all active:scale-95">
                        <RefreshCw size={20} className={loadingMetrics ? "animate-spin" : ""} />
                    </button>"""

new_global_controls = """<div className="flex flex-wrap items-center gap-4">
                    <button onClick={refetchAll} className="p-3 bg-white text-gray-600 rounded-2xl border border-gray-200/60 shadow-sm hover:bg-gray-50 transition-all active:scale-95" title="Actualizar datos">
                        <RefreshCw size={20} className={loadingHoy ? "animate-spin" : ""} />
                    </button>"""
content = content.replace(global_controls, new_global_controls)

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated states and removed global filter")
