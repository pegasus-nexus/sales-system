import os
import re

path = 'frontend/src/pages/CajaPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target1 = '''    // gasto
    const [gastoMonto, setGastoMonto] = useState('');
    const [gastoDesc, setGastoDesc] = useState('');
    const [gastoCategId, setGastoCategId] = useState('');'''

replacement1 = '''    // gasto
    const [gastoMonto, setGastoMonto] = useState('');
    const [gastoDesc, setGastoDesc] = useState('');
    const [gastoCategId, setGastoCategId] = useState('');
    const [gastoSubCategId, setGastoSubCategId] = useState('');'''

data = data.replace(target1, replacement1)

target2 = '''    const handleGasto = () => {
        if (!gastoMonto || !gastoDesc) return;
        gastoMut.mutate({
            monto: parseFloat(gastoMonto),
            descripcion: gastoDesc,
            categoria_id: gastoCategId || undefined,
            metodo: 'EFECTIVO'
        }, {
            onSuccess: () => { setModal(null); setGastoMonto(''); setGastoDesc(''); setGastoCategId(''); }
        });
    };'''

replacement2 = '''    const handleGasto = () => {
        if (!gastoMonto) return;
        gastoMut.mutate({
            monto: parseFloat(gastoMonto),
            descripcion: gastoDesc || "Sin descripción",
            categoria_id: gastoCategId || undefined,
            subcategoria_id: gastoSubCategId || undefined,
            metodo: 'EFECTIVO'
        }, {
            onSuccess: () => { setModal(null); setGastoMonto(''); setGastoDesc(''); setGastoCategId(''); setGastoSubCategId(''); }
        });
    };'''

data = data.replace(target2, replacement2)

target3 = '''                                                  <select value={gastoCategId} onChange={e => setGastoCategId(e.target.value)}
                                                      className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300 text-gray-900">
                                                      <option value="">Sin categoría</option>
                                                      {categorias.map(c => (
                                                          <option key={c._id} value={c._id}>{c.nombre}</option>
                                                      ))}
                                                  </select>'''

replacement3 = '''                                                  <select value={gastoCategId} onChange={e => { setGastoCategId(e.target.value); setGastoSubCategId(''); }}
                                                      className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300 text-gray-900">
                                                      <option value="">Sin categoría</option>
                                                      {categorias.filter(c => !c.padre_id).map(c => (
                                                          <option key={c._id} value={c._id}>{c.partida ? []  : ''}{c.nombre}</option>
                                                      ))}
                                                  </select>'''

data = data.replace(target3, replacement3)

target4 = '''                                          <div>
                                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descripción</label>
                                              <input type="text" value={gastoDesc} onChange={e => setGastoDesc(e.target.value)}
                                                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300 text-gray-900"
                                                  placeholder="¿En qué se gastó?" />
                                          </div>
                                      </div>

                                      <button onClick={handleGasto} disabled={!gastoMonto || !gastoDesc || gastoMut.isPending}'''

replacement4 = '''                                          {gastoCategId && categorias.some(c => c.padre_id === gastoCategId) && (
                                              <div>
                                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Subcategoría (Opcional)</label>
                                                  <select value={gastoSubCategId} onChange={e => setGastoSubCategId(e.target.value)}
                                                      className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300 text-gray-900">
                                                      <option value="">Seleccione una subcategoría...</option>
                                                      {categorias.filter(c => c.padre_id === gastoCategId).map(c => (
                                                          <option key={c._id} value={c._id}>{c.partida ? []  : ''}{c.nombre}</option>
                                                      ))}
                                                  </select>
                                              </div>
                                          )}
                                          <div>
                                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descripción (Opcional)</label>
                                              <input type="text" value={gastoDesc} onChange={e => setGastoDesc(e.target.value)}
                                                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300 text-gray-900"
                                                  placeholder="¿En qué se gastó?" />
                                          </div>
                                      </div>

                                      <button onClick={handleGasto} disabled={!gastoMonto || gastoMut.isPending}'''

data = data.replace(target4, replacement4)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("CajaPage updated for subcategories.")
