import sys

with open("frontend/src/pages/InventarioPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_str = "import { getInventario"
if "exportInventarioExcel" not in content:
    content = content.replace(import_str, "import { exportInventarioExcel, getInventario")

# Add FileSpreadsheet icon if not imported
if "FileSpreadsheet" not in content:
    content = content.replace("import { Plus", "import { FileSpreadsheet, Plus")

button_code = """                <div className="flex gap-3">
                    <button 
                        onClick={() => exportInventarioExcel().then(() => toast.success('Inventario exportado')).catch(() => toast.error('Error al exportar'))}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                        title="Exportar Stock Completo (Excel)"
                    >
                        <FileSpreadsheet size={16} />
                        Exportar Excel
                    </button>
                    {esMatriz && ("""

target = """                <div className="flex gap-3">
                    {esMatriz && ("""

if "Exportar Excel" not in content:
    content = content.replace(target, button_code)
    
with open("frontend/src/pages/InventarioPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated InventarioPage.tsx")
