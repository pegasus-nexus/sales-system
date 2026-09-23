import re

with open("frontend/src/pages/ComunidadPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

metrics_replacement = """
            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 relative group">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Afiliados Web</p>
                        <p className="text-3xl font-black text-gray-900">{stats.total_registrados}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">Personas que se registraron online.</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 relative group">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Gift size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Reclamaron Cupones</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-gray-900">{stats.total_reclamados}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">Clientes que reclamaron el premio en la web.</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 relative group">
                        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                            <CheckCircle size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Entregados en Tienda</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-gray-900">{stats.total_entregados || 0}</p>
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg border border-green-200">
                                {stats.total_reclamados > 0 ? Math.round(((stats.total_entregados || 0) / stats.total_reclamados) * 100) : 0}% efectividad
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">De los que reclamaron, cuántos fueron físicamente a la sucursal.</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 relative group">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center">
                            <MousePointerClick size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Visitas a la Landing</p>
                        <p className="text-3xl font-black text-gray-900">{stats.total_visitas_globales}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">Número total de visitas a la página web de registro.</p>
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

with open("frontend/src/pages/ComunidadPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Frontend stats grid updated.")
