import sys
import re

file_path = "frontend/src/pages/ControlInventarioPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

bad_dif = """<td className={`px-4 py-2 text-right font-bold font-mono ${item.diferencia < 0 ? 'text-red-600' : (item.diferencia > 0 ? 'text-blue-600' : 'text-gray-400')}`}>
                                        {item.stock_fisico !== null ? (item.diferencia > 0 ? '+' : '') + item.diferencia.toFixed(2) : '-'}
                                    </td>"""

good_dif = """{isFinished && (
                                        <td className={`px-4 py-2 text-right font-bold font-mono ${item.diferencia < 0 ? 'text-red-600' : (item.diferencia > 0 ? 'text-blue-600' : 'text-gray-400')}`}>
                                            {item.stock_fisico !== null ? (item.diferencia > 0 ? '+' : '') + item.diferencia.toFixed(2) : '-'}
                                        </td>
                                    )}"""

bad_val = """<td className={`px-4 py-2 text-right font-mono ${item.valor_diferencia < 0 ? 'text-red-600' : (item.valor_diferencia > 0 ? 'text-blue-600' : 'text-gray-400')}`}>
                                        {item.stock_fisico !== null ? item.valor_diferencia.toFixed(2) : '-'}
                                    </td>"""

good_val = """{isFinished && (
                                        <td className={`px-4 py-2 text-right font-mono ${item.valor_diferencia < 0 ? 'text-red-600' : (item.valor_diferencia > 0 ? 'text-blue-600' : 'text-gray-400')}`}>
                                            {item.stock_fisico !== null ? item.valor_diferencia.toFixed(2) : '-'}
                                        </td>
                                    )}"""

content = content.replace(bad_dif, good_dif)
content = content.replace(bad_val, good_val)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Wrapped dif columns")
