import sys
import re

file_path = "frontend/src/pages/ControlInventarioPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports for modal
if "import { useConfirm }" not in content:
    content = content.replace("import { toast } from 'sonner';", "import { toast } from 'sonner';\nimport { useConfirm } from '../components/ConfirmModal';")

# Replace startMutation usage
start_modal_code = """
    const [showStartModal, setShowStartModal] = useState(false);
    const [startNotas, setStartNotas] = useState("Conteo General");
    const confirm = useConfirm();

    const handleStart = () => {
        setShowStartModal(true);
    };

    const confirmStart = () => {
        startMutation.mutate(startNotas);
        setShowStartModal(false);
    };
"""

content = content.replace("const handleStart = () => {\n        if (!confirm(`Iniciar un nuevo conteo fsico para la sucursal seleccionada?\\nSe tomar una foto del stock \nactual del sistema.`)) return;\n        startMutation.mutate(\"Conteo General\");\n    };", start_modal_code)
# Also fix the weird characters from the other confirm
content = re.sub(r"if\(!?confirm\('Finalizar conteo\? Ya no podrs editarlo y se generar el reporte \ndefinitivo\.'\)\) \{", "if(await confirm({title: 'Finalizar Conteo', message: '¿Finalizar conteo? Ya no podrás editarlo y se generará el reporte definitivo.', type: 'warning'})) {", content)
content = content.replace("onClick={() => {", "onClick={async () => {")

# Add modal JSX to the main view return
modal_jsx = """
            {showStartModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">Iniciar Nuevo Conteo Físico</h3>
                            <button onClick={() => setShowStartModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-gray-600">
                                Se tomará una fotografía del inventario actual del sistema para compararlo con tu conteo físico.
                            </p>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Motivo / Notas del Conteo</label>
                                <input 
                                    type="text" 
                                    value={startNotas}
                                    onChange={(e) => setStartNotas(e.target.value)}
                                    placeholder="Ej: Conteo mensual, Inventario general, etc."
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                            <button 
                                onClick={() => setShowStartModal(false)}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmStart}
                                disabled={startMutation.isPending}
                                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                            >
                                {startMutation.isPending && <Loader2 size={16} className="animate-spin"/>}
                                Iniciar Conteo
                            </button>
                        </div>
                    </div>
                </div>
            )}
"""
content = content.replace('<div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">', '<div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">\n' + modal_jsx)

# Also need to import X from lucide-react if not there
if "X, Loader2" not in content and "X," not in content:
    content = content.replace("Loader2", "Loader2, X")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Added Start Modal")
