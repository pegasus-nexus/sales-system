f = open('frontend/src/pages/VentasPage.tsx', 'r', encoding='utf-8')
c = f.read()
f.close()

modal = '''
                {updateDateVenta && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                            <h2 className="text-lg font-bold text-gray-800 mb-2">Modificar Fecha de Venta</h2>
                            <p className="text-sm text-gray-500 mb-4">Esta acción cambiará la fecha de la venta en todos los reportes (Kardex, Caja y BI).</p>
                            
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nueva Fecha y Hora</label>
                            <input 
                                type="datetime-local" 
                                value={nuevaFecha} 
                                onChange={e => setNuevaFecha(e.target.value)} 
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
                            />
                            
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setUpdateDateVenta(null)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancelar</button>
                                <button 
                                    onClick={() => updateDateMut.mutate({ id: updateDateVenta._id, fecha: nuevaFecha })}
                                    disabled={updateDateMut.isPending}
                                    className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {updateDateMut.isPending ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
'''

idx = c.find('                {anularVenta && (')
if idx != -1:
    c = c[:idx] + modal + c[idx:]
    with open('frontend/src/pages/VentasPage.tsx', 'w', encoding='utf-8') as fw:
        fw.write(c)
