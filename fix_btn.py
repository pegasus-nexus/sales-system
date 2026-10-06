import sys
import re

file_path = "frontend/src/pages/InventarioPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "isExportingExcel" not in content:
    # Add state
    state_anchor = "const [search, setSearch] = useState('');"
    content = content.replace(state_anchor, state_anchor + "\n    const [isExportingExcel, setIsExportingExcel] = useState(false);")
    
    # Replace button
    old_btn = """                    <button 
                        onClick={() => exportInventarioExcel().then(() => toast.success('Inventario exportado')).catch(() => toast.error('Error al exportar'))}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                        title="Exportar Stock Completo (Excel)"
                    >
                        <FileSpreadsheet size={16} />
                        Exportar Excel
                    </button>"""
    new_btn = """                    <button 
                        onClick={async () => {
                            setIsExportingExcel(true);
                            try {
                                await exportInventarioExcel();
                                toast.success('Inventario exportado');
                            } catch (e) {
                                toast.error('Error al exportar');
                            } finally {
                                setIsExportingExcel(false);
                            }
                        }}
                        disabled={isExportingExcel}
                        className={`flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors ${isExportingExcel ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Exportar Stock Completo (Excel)"
                    >
                        {isExportingExcel ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                        {isExportingExcel ? 'Generando...' : 'Exportar Excel'}
                    </button>"""
    content = content.replace(old_btn, new_btn)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added loading state to button")
