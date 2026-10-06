import os
import re

path = 'frontend/src/api/api.ts'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

# Make sure it's fully replaced for getExpensesReport
data = re.sub(
    r"export const getExpensesReport = \(startDate: string, endDate: string, sucursalId\?: string, categoriaId\?: string, subcategoriaId\?: string\) => \{",
    "export const getExpensesReport = (startDate: string, endDate: string, sucursalId?: string, categoriaId?: string, subcategoriaId?: string) => {",
    data
)

data = re.sub(
    r"if \(categoriaId && categoriaId !== 'all'\) params\.set\('categoria_id', categoriaId\);\s+return client<unknown>",
    "if (categoriaId && categoriaId !== 'all') params.set('categoria_id', categoriaId);\n    if (subcategoriaId && subcategoriaId !== 'all') params.set('subcategoria_id', subcategoriaId);\n    return client<unknown>",
    data
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

path = 'frontend/src/pages/CajaPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target = """                                                <select value={gastoCategId} onChange={e => setGastoCategId(e.target.value)}
                                                    className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300 text-gray-900">
                                                    <option value="">Sin categoría</option>
                                                    {categorias.map(c => (
                                                        <option key={c._id} value={c._id}>{c.nombre}</option>
                                                    ))}
                                                </select>"""
replacement = """                                                <select value={gastoCategId} onChange={e => { setGastoCategId(e.target.value); setGastoSubCategId(''); }}
                                                    className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300 text-gray-900">
                                                    <option value="">Sin categoría</option>
                                                    {categorias.filter(c => !c.padre_id).map(c => (
                                                        <option key={c._id} value={c._id}>{c.partida ? `[${c.partida}] ` : ''}{c.nombre}</option>
                                                    ))}
                                                </select>"""
data = data.replace(target.replace('í', 'A-'), replacement.replace('í', 'A-'))

target2 = """                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descripción</label>
                                            <input type="text" value={gastoDesc} onChange={e => setGastoDesc(e.target.value)}
                                                className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300 text-gray-900"
                                                placeholder="¿En qué se gastó?" />
                                        </div>"""

replacement2 = """                                        {gastoCategId && categorias.some(c => c.padre_id === gastoCategId) && (
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

data = data.replace(target2.replace('ó', 'A3').replace('¿', 'A?'), replacement2.replace('ó', 'A3').replace('¿', 'A?'))

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("Warnings patched.")
