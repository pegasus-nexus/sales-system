
import os
import re

page_path = "frontend/src/pages/CatalogoPage.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    page_data = f.read()

scope_modal_ui = """
                    {isMatrizAdmin && (
                        <div className="pb-4 border-b border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sucursales Permitidas (Alcance)</label>
                            <p className="text-xs text-gray-500 mb-2">Si no seleccionas ninguna, el producto será Global y todas las sucursales lo podrán ver. Si seleccionas alguna, será exclusivo para ellas.</p>
                            <select
                                multiple
                                className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-2.5 outline-none transition-all text-sm text-gray-900"
                                value={formData.sucursales_permitidas || []}
                                onChange={e => {
                                    const options = Array.from(e.target.selectedOptions).map(o => o.value);
                                    setFormData({ ...formData, sucursales_permitidas: options });
                                }}
                            >
                                {sucursales.map(suc => (
                                    <option key={suc._id} value={suc._id}>{suc.nombre}</option>
                                ))}
                            </select>
                            {(formData.sucursales_permitidas || []).length > 0 && (
                                <div className="mt-2 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, sucursales_permitidas: [] })}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                                    >
                                        Limpiar selección (Hacer Global)
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
"""

if "Sucursales Permitidas (Alcance)" not in page_data:
    target = "{!isBranchAdmin && sucursales.length > 0 && ("
    page_data = page_data.replace(target, scope_modal_ui + "\n" + target)
    with open(page_path, "w", encoding="utf-8") as f:
        f.write(page_data)

print("CatalogoPage modal patched.")

