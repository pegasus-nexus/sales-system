
import os
import re

page_path = "frontend/src/pages/CatalogoPage.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    page_data = f.read()

# Add header
if "Alcance</th>" not in page_data:
    page_data = page_data.replace(
        "<th className=\"px-6 py-4\">CategorA-a</th>",
        "<th className=\"px-6 py-4\">Categoría</th>\n                                <th className=\"px-6 py-4\">Alcance</th>"
    )

# Find the category column in the body
cat_col = """                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                            <Tag size={12} />
                                            {p.categoria_nombre || "Sin Categoría"}
                                        </span>
                                    </td>"""

scope_col = """                                    <td className="px-6 py-4">
                                        {(!p.sucursales_permitidas || p.sucursales_permitidas.length === 0) ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                                                Global
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-wider">
                                                Exclusivo ({p.sucursales_permitidas.length})
                                            </span>
                                        )}
                                    </td>"""

if "Global" not in page_data or "Exclusivo (" not in page_data:
    # Need to replace the category column carefully to insert scope_col right after it
    page_data = page_data.replace(cat_col, cat_col + "\n" + scope_col)

# Also we need to fix the colSpan for loading/empty states
page_data = page_data.replace("colSpan={isMatrizAdmin ? 6 : 5}", "colSpan={isMatrizAdmin ? 7 : 6}")
page_data = page_data.replace("colSpan={isMatrizAdmin ? 7 : 6}", "colSpan={isMatrizAdmin ? 8 : 7}") # Just in case

with open(page_path, "w", encoding="utf-8") as f:
    f.write(page_data)

print("CatalogoPage table patched.")

