import os
import re

path = 'frontend/src/pages/CreditosPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

# Fix the main table "Cosas de la nada" -> show unknown if no name
target_table_name = "                                                <div className=\"font-bold text-gray-900\">{c.cliente_nombre}</div>"
replacement_table_name = "                                                <div className=\"font-bold text-gray-900\">{c.cliente_nombre || 'Cliente Desconocido'}</div>"
data = data.replace(target_table_name, replacement_table_name)

# Fix DEUDAS tab
target_deuda = """                                                      <div>
                                                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Ticket #{d.sale_id_corto}</span>
                                                          <h4 className="font-bold text-gray-900 mt-1">Saldo: Bs. {d.saldo_pendiente.toFixed(2)}</h4>
                                                          <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">{formatDate(d.fecha_emision)}</p>
                                                      </div>"""

replacement_deuda = """                                                      <div>
                                                          <div className="flex items-center gap-2">
                                                              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter" title={ID: }>
                                                                  Ticket #{d.numero_ticket || d.sale_id_corto}
                                                              </span>
                                                          </div>
                                                          <h4 className="font-bold text-rose-600 mt-1">Deuda: Bs. {d.saldo_pendiente.toFixed(2)} <span className="text-gray-400 font-medium text-[10px]">/ Orig. Bs. {d.monto_original.toFixed(2)}</span></h4>
                                                          <p className="text-[11px] text-gray-700 font-medium mt-1 leading-tight flex items-center gap-1">
                                                              🛒 {d.resumen_items || 'Productos Varios'}
                                                          </p>
                                                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{formatDate(d.fecha_emision)}</p>
                                                      </div>"""
data = data.replace(target_deuda, replacement_deuda)

# Fix HISTORIAL tab
target_historial = """                                                          {h.pagos && h.pagos.length > 0 && !h.anulada && (
                                                              <div className="mt-1 flex flex-col items-end gap-0.5">
                                                                  {h.pagos.map((p: any, idx: number) => (
                                                                      <span key={idx} className="text-[8px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                                                          {p.metodo}
                                                                      </span>
                                                                  ))}
                                                              </div>
                                                          )}"""

replacement_historial = """                                                          {h.pagos && h.pagos.length > 0 && !h.anulada && (
                                                              <div className="mt-1.5 flex flex-col items-end gap-1">
                                                                  {h.pagos.map((p: any, idx: number) => (
                                                                      <span key={idx} className={	ext-[9px] font-black px-2 py-0.5 rounded-md border shadow-sm flex items-center gap-1 }>
                                                                          {p.metodo} {p.referencia || p.banco ? |  .trim() : ''} 
                                                                          <span className="opacity-60 ml-1">(Bs.{p.monto})</span>
                                                                      </span>
                                                                  ))}
                                                              </div>
                                                          )}"""

data = data.replace(target_historial, replacement_historial)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("CreditosPage patched")
