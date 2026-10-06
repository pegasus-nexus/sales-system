import sys

with open("frontend/src/pages/TenantDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_code = "import { getDashboardMatriz, getSucursales"
new_import = "import api from '../api/client';\nimport { getDashboardMatriz, getSucursales"
if "import api from" not in content:
    content = content.replace(import_code, new_import)

query_code = "const { data: metricsHoy"
new_query = """const { data: exchangeRates } = useQuery({ queryKey: ['exchange-rates'], queryFn: async () => { const res = await api.get('/dashboard-matriz/exchange-rates'); return res.data; }, refetchInterval: 1800000 });
    const { data: metricsHoy"""
if "exchangeRates" not in content:
    content = content.replace(query_code, new_query)

header_code = """                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard General</h1>
                    <p className="text-gray-500 mt-1 font-medium">Panel de control de Matriz</p>
                </div>"""
new_header = """                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard General</h1>
                    <p className="text-gray-500 mt-1 font-medium">Panel de control de Matriz</p>
                </div>
                
                {exchangeRates && (
                    <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-lg">🏦</span>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Oficial BCB</span>
                                <span className="text-sm font-black text-slate-700">Bs {exchangeRates.bcb_oficial}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 rounded-lg border border-yellow-100">
                            <span className="text-lg">💱</span>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider">Binance P2P</span>
                                <span className="text-sm font-black text-yellow-900">Bs {exchangeRates.binance_p2p}</span>
                            </div>
                        </div>
                    </div>
                )}"""
if "exchangeRates &&" not in content:
    content = content.replace(header_code, new_header)

with open("frontend/src/pages/TenantDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated TenantDashboard.tsx")
