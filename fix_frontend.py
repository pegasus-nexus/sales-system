import re

with open("frontend/src/pages/ComunidadPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add state for tabs
if "const [tipoFiltro, setTipoFiltro]" not in content:
    content = content.replace(
        "const [miembrosPage, setMiembrosPage] = useState(1);",
        "const [miembrosPage, setMiembrosPage] = useState(1);\n    const [tipoFiltro, setTipoFiltro] = useState<'comunidad' | 'regulares' | 'todos'>('comunidad');"
    )

# 2. Add it to useQuery
content = content.replace(
    "queryKey: ['comunidad-miembros', miembrosPage, debouncedSearch]",
    "queryKey: ['comunidad-miembros', miembrosPage, debouncedSearch, tipoFiltro]"
)

# 3. Add to API call
content = content.replace(
    "const res = await client<any>(`/comunidad/miembros?limit=10&skip=${skip}${searchParam}`);",
    "const res = await client<any>(`/comunidad/miembros?limit=10&skip=${skip}&tipo=${tipoFiltro}${searchParam}`);"
)

# 4. Update the metrics layout and percentage
# Find where the stats are rendered
metrics_replacement = """
            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 relative group">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Registrados</p>
                        <p className="text-3xl font-black text-gray-900">{stats.total_registrados}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">Clientes que se han unido a la comunidad (Web o QR).</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 relative group">
                        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                            <Gift size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Cupones Reclamados</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-gray-900">{stats.total_reclamados}</p>
                            <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">
                                {stats.total_registrados > 0 ? Math.round((stats.total_reclamados / stats.total_registrados) * 100) : 0}% reclamó
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">Miembros de la comunidad que ya usaron su beneficio.</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 relative group">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <PercentIcon />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Tasa de Conversión</p>
                        <p className="text-3xl font-black text-gray-900">{stats.tasa_conversion}%</p>
                        <p className="text-[10px] text-gray-400 leading-tight">Porcentaje de usuarios web que terminaron registrándose.</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 relative group">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center">
                            <MousePointerClick size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Visitas a la Landing</p>
                        <p className="text-3xl font-black text-gray-900">{stats.total_visitas_globales}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">Número total de visitas a la página de registro.</p>
                    </div>
                </div>
            )}
"""

content = re.sub(
    r'\{\/\* Stats Grid \*\/.*?\}\)',
    metrics_replacement.strip(),
    content,
    flags=re.DOTALL
)


# 5. Add tabs above the table
tabs_html = """
                <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-gray-900">Directorio de Clientes</h2>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl w-max">
                            <button onClick={() => { setTipoFiltro('comunidad'); setMiembrosPage(1); }} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${tipoFiltro === 'comunidad' ? 'bg-white text-indigo-700 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-700'}`}>Miembros Comunidad</button>
                            <button onClick={() => { setTipoFiltro('regulares'); setMiembrosPage(1); }} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${tipoFiltro === 'regulares' ? 'bg-white text-indigo-700 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-700'}`}>Regulares (No Web)</button>
                            <button onClick={() => { setTipoFiltro('todos'); setMiembrosPage(1); }} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${tipoFiltro === 'todos' ? 'bg-white text-indigo-700 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-700'}`}>Todos</button>
                        </div>
                    </div>
                    
                    <div className="relative w-full md:w-80">
"""

content = re.sub(
    r'<div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">\s*<div className="flex items-center gap-2">\s*<h2 className="text-lg font-bold text-gray-900">Miembros de la Comunidad Web</h2>\s*<span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">NUEVO</span>\s*</div>\s*<div className="relative w-full md:w-80">',
    tabs_html.strip(),
    content,
    flags=re.DOTALL
)

with open("frontend/src/pages/ComunidadPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Frontend modificado")
