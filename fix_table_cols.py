import sys
import re

file_path = "frontend/src/pages/ControlInventarioPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I need to conditionally hide the following columns if !isFinished:
# - Stock Sistema
# - Diferencia
# - Valor (Bs)

# Header changes
th_stock_sistema_bad = '<th className="px-4 py-3 font-semibold text-right w-32">Stock Sistema</th>'
th_stock_sistema_good = '{isFinished && <th className="px-4 py-3 font-semibold text-right w-32">Stock Sistema</th>}'

th_stock_fisico_bad = '<th className="px-4 py-3 font-semibold text-center w-40 bg-indigo-900">STOCK FÍSICO</th>'
th_stock_fisico_good = '<th className="px-4 py-3 font-semibold text-center w-40 bg-indigo-900">Stock Físico</th>'

th_dif_bad = '<th className="px-4 py-3 font-semibold text-right w-32">Diferencia</th>'
th_dif_good = '{isFinished && <th className="px-4 py-3 font-semibold text-right w-32">Diferencia</th>}'

th_val_bad = '<th className="px-4 py-3 font-semibold text-right w-32">Valor (Bs)</th>'
th_val_good = '{isFinished && <th className="px-4 py-3 font-semibold text-right w-32">Valor (Bs)</th>}'

content = content.replace(th_stock_sistema_bad, th_stock_sistema_good)
content = content.replace(th_dif_bad, th_dif_good)
content = content.replace(th_val_bad, th_val_good)
# Try to replace the weird encoding for STOCK FISICO
content = re.sub(r'<th className="px-4 py-3 font-semibold text-center w-40 bg-indigo-900">STOCK F[^<]*SICO</th>', th_stock_fisico_good, content)

# Also add the new category and provider columns!
th_cat_prov = """<th className="px-4 py-3 font-semibold">Categoría</th>
                            <th className="px-4 py-3 font-semibold">Proveedor</th>"""
# Insert after Producto
content = content.replace('<th className="px-4 py-3 font-semibold">Producto</th>', '<th className="px-4 py-3 font-semibold">Producto</th>\n                            ' + th_cat_prov)

# Body changes
# I need to conditionally hide the cells for stock_sistema, diferencia, and valor_diferencia.
# And add cells for category and provider.

# The existing table body looks like:
# <td className="px-4 py-2 font-mono text-xs">{item.codigo_corto || '-'}</td>
# <td className="px-4 py-2 max-w-[300px] truncate font-medium" title={item.descripcion}>{item.descripcion}</td>
# <td className="px-4 py-2 text-right text-gray-500 font-mono">{item.stock_sistema.toFixed(2)}</td>

td_sistema_bad = '<td className="px-4 py-2 text-right text-gray-500 font-mono">{item.stock_sistema.toFixed(2)}</td>'
td_sistema_good = '{isFinished && <td className="px-4 py-2 text-right text-gray-500 font-mono">{item.stock_sistema.toFixed(2)}</td>}'

td_cat_prov = """<td className="px-4 py-2 text-gray-600 text-xs">{item.categoria_nombre || '-'}</td>
                                    <td className="px-4 py-2 text-gray-600 text-xs truncate max-w-[150px]" title={item.proveedores?.join(', ') || '-'}>{item.proveedores?.join(', ') || '-'}</td>"""

content = content.replace(td_sistema_bad, td_sistema_good)
content = content.replace('<td className="px-4 py-2 max-w-[300px] truncate font-medium" title={item.descripcion}>{item.descripcion}</td>', '<td className="px-4 py-2 max-w-[300px] truncate font-medium" title={item.descripcion}>{item.descripcion}</td>\n                                    ' + td_cat_prov)

td_dif_bad = """{isFinished && (
                                            <td className={`px-4 py-2 text-right font-bold font-mono ${item.diferencia < 0 ? 'text-red-600' : (item.diferencia > 0 ? 'text-blue-600' : 'text-gray-400')}`}>
                                                {item.diferencia > 0 ? '+' : ''}{item.diferencia.toFixed(2)}
                                            </td>
                                        )}
                                        {isFinished && (
                                            <td className={`px-4 py-2 text-right font-bold font-mono ${item.valor_diferencia < 0 ? 'text-red-600' : (item.valor_diferencia > 0 ? 'text-blue-600' : 'text-gray-400')}`}>
                                                {item.valor_diferencia.toFixed(2)}
                                            </td>
                                        )}"""
if "{isFinished && (" not in content:
    # They are not currently wrapped in isFinished!
    # Let's see how they look.
    pass

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated table columns")
