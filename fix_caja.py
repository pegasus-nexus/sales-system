import os
import re

path = 'frontend/src/pages/CajaPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

# Fix handleGasto
data = re.sub(
    r"categoria_id: gastoCategId \|\| undefined,",
    "categoria_id: gastoCategId || undefined,\n            subcategoria_id: gastoSubCategId || undefined,",
    data
)

data = re.sub(
    r"setGastoCategId\(''\);\s*\}",
    "setGastoCategId(''); setGastoSubCategId(''); }",
    data
)

# Fix the category select to use filter and show subcategories
target_ui = """                                                <select value={gastoCategId} onChange={e => setGastoCategId(e.target.value)}
                                                    className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300 text-gray-900">
                                                    <option value="">Sin categoría</option>
                                                    {categorias.map(c => (
                                                        <option key={c._id} value={c._id}>{c.nombre}</option>
                                                    ))}
                                                </select>"""
replacement_ui = """                                                <select value={gastoCategId} onChange={e => { setGastoCategId(e.target.value); setGastoSubCategId(''); }}
                                                    className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300 text-gray-900">
                                                    <option value="">Sin categoría</option>
                                                    {categorias.filter(c => !c.padre_id).map(c => (
                                                        <option key={c._id} value={c._id}>{c.partida ? `[${c.partida}] ` : ''}{c.nombre}</option>
                                                    ))}
                                                </select>"""
data = data.replace(target_ui.replace('í', 'A-'), replacement_ui.replace('í', 'A-'))

target_desc = """                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descripción</label>
                                            <input type="text" value={gastoDesc} onChange={e => setGastoDesc(e.target.value)}
                                                className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300 text-gray-900"
                                                placeholder="¿En qué se gastó?" />
                                        </div>"""

replacement_desc = """                                        {gastoCategId && categorias.some(c => c.padre_id === gastoCategId) && (
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Subcategoría (Opcional)</label>
                                                <select value={gastoSubCategId} onChange={e => setGastoSubCategId(e.target.value)}
                                                    className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300 text-gray-900">
                                                    <option value="">Seleccione subcategoría...</option>
                                                    {categorias.filter(c => c.padre_id === gastoCategId).map(c => (
                                                        <option key={c._id} value={c._id}>{c.partida ? `[${c.partida}] ` : ''}{c.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descripción (Opcional)</label>
                                            <input type="text" value={gastoDesc} onChange={e => setGastoDesc(e.target.value)}
                                                className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300 text-gray-900"
                                                placeholder="¿En qué se gastó?" />
                                        </div>"""

data = data.replace(target_desc.replace('ó', 'A3').replace('¿', 'A?'), replacement_desc.replace('ó', 'A3').replace('¿', 'A?'))

data = re.sub(
    r"disabled=\{!gastoMonto \|\| !gastoDesc",
    "disabled={!gastoMonto",
    data
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("CajaPage fully patched.")
