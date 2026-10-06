import os

path = 'frontend/src/components/ExpensesReportView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

# Replace category management form
target_form = '''                                {/* Form to add */}
                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-amber-700 uppercase">Nueva Categoría</p>
                                    <div className="space-y-3">
                                        <input 
                                            type="text" 
                                            placeholder="Nombre (ej. Limpieza)"
                                            value={newCatName}
                                            onChange={e => setNewCatName(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Descripción corta"
                                            value={newCatDesc}
                                            onChange={e => setNewCatDesc(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                        />
                                        <button 
                                            onClick={() => createCatMut.mutate({ nombre: newCatName, descripcion: newCatDesc })}
                                            disabled={!newCatName || createCatMut.isPending}
                                            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                                        >
                                            {createCatMut.isPending ? 'Agregando...' : 'Agregar Categoría'}
                                        </button>
                                    </div>
                                </div>'''

replacement_form = '''                                {/* Form to add */}
                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-amber-700 uppercase">Nueva Categoría</p>
                                    <div className="space-y-3">
                                        <input 
                                            type="text" 
                                            placeholder="Nombre (ej. Limpieza)"
                                            value={newCatName}
                                            onChange={e => setNewCatName(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Partida Contable (ej. 01)"
                                            value={newCatPartida}
                                            onChange={e => setNewCatPartida(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                        />
                                        <select 
                                            value={newCatPadreId}
                                            onChange={e => setNewCatPadreId(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                        >
                                            <option value="">(Es categoría principal)</option>
                                            {categories.filter((c:any) => !c.padre_id).map((c:any) => (
                                                <option key={c._id} value={c._id}>Subcategoría de: {c.nombre}</option>
                                            ))}
                                        </select>
                                        <input 
                                            type="text" 
                                            placeholder="Descripción corta"
                                            value={newCatDesc}
                                            onChange={e => setNewCatDesc(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                        />
                                        <button 
                                            onClick={() => createCatMut.mutate({ nombre: newCatName, descripcion: newCatDesc, partida: newCatPartida, padre_id: newCatPadreId || undefined })}
                                            disabled={!newCatName || createCatMut.isPending}
                                            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                                        >
                                            {createCatMut.isPending ? 'Agregando...' : 'Agregar Categoría'}
                                        </button>
                                    </div>
                                </div>'''

data = data.replace(target_form.replace('í', 'A-').replace('ó', 'A3'), replacement_form.replace('í', 'A-').replace('ó', 'A3'))

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("Form replaced.")
